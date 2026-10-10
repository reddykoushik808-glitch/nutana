from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo.database import Database
from app.core.exceptions import EntityNotFoundException, InsufficientStockException

class InventoryService:
    def __init__(self, db: Database):
        self.db = db

    def get_product(self, shop_id: str, product_id: str) -> Dict[str, Any]:
        product = self.db.products.find_one({"_id": ObjectId(product_id), "shop_id": shop_id})
        if not product:
            raise EntityNotFoundException("Product", product_id)
        return self._enrich_product_metrics(shop_id, product)

    def list_products(
        self,
        shop_id: str,
        category: Optional[str] = None,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"shop_id": shop_id, "is_active": True}
        if category and category != "All":
            query["category"] = category
        if search:
            query["name"] = {"$regex": search, "$options": "i"}

        products = list(self.db.products.find(query).sort("name", 1))
        enriched = [self._enrich_product_metrics(shop_id, p) for p in products]

        if status_filter and status_filter != "All":
            enriched = [p for p in enriched if p["stock_status"].lower().replace(" ", "") == status_filter.lower().replace(" ", "")]

        return enriched

    def _enrich_product_metrics(self, shop_id: str, product: Dict[str, Any]) -> Dict[str, Any]:
        product_id_str = str(product["_id"])
        now = datetime.now(timezone.utc)

        # Retrieve active batches
        batches = list(self.db.inventory_batches.find({
            "shop_id": shop_id,
            "product_id": product_id_str,
            "status": "active"
        }).sort("expiry_date", 1))

        total_qty = 0.0
        reserved_qty = 0.0
        available_qty = 0.0
        nearest_expiry = None
        has_expiring_soon = False

        shop = self.db.shops.find_one({"_id": ObjectId(shop_id)})
        warn_days = (shop or {}).get("expiry_warning_days", 7)

        for b in batches:
            b_exp = b.get("expiry_date")
            b_avail = float(b.get("quantity_available", 0.0))
            b_res = float(b.get("quantity_reserved", 0.0))

            # Exclude expired stock from available
            if b_exp and b_exp < now:
                # auto-mark as expired if remaining
                if b_avail > 0:
                    self.db.inventory_batches.update_one(
                        {"_id": b["_id"]},
                        {"$set": {"status": "expired", "updated_at": now}}
                    )
                continue

            available_qty += b_avail
            reserved_qty += b_res
            total_qty += (b_avail + b_res)

            if b_exp and b_avail > 0:
                if nearest_expiry is None or b_exp < nearest_expiry:
                    nearest_expiry = b_exp
                days_left = (b_exp - now).days
                if days_left <= warn_days:
                    has_expiring_soon = True

        min_threshold = float(product.get("minimum_stock_threshold", 5.0))

        if available_qty <= 0:
            stock_status = "Out of Stock"
        elif has_expiring_soon:
            stock_status = "Expiring Soon"
        elif available_qty <= min_threshold:
            stock_status = "Low Stock"
        else:
            stock_status = "In Stock"

        return {
            "id": product_id_str,
            "shop_id": shop_id,
            "name": product["name"],
            "sku": product.get("sku"),
            "barcode": product.get("barcode"),
            "category": product.get("category", "General"),
            "brand": product.get("brand"),
            "unit": product.get("unit", "unit"),
            "selling_price": float(product.get("selling_price", 0.0)),
            "minimum_stock_threshold": min_threshold,
            "total_quantity": round(total_qty, 3),
            "reserved_quantity": round(reserved_qty, 3),
            "available_quantity": round(available_qty, 3),
            "batch_count": len([b for b in batches if b.get("quantity_available", 0) > 0]),
            "nearest_expiry": nearest_expiry,
            "stock_status": stock_status,
            "is_active": product.get("is_active", True),
            "created_at": product.get("created_at", now),
            "updated_at": product.get("updated_at", now),
        }

    def create_batch(self, shop_id: str, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        product = self.db.products.find_one({"_id": ObjectId(data["product_id"]), "shop_id": shop_id})
        if not product:
            raise EntityNotFoundException("Product", data["product_id"])

        now = datetime.now(timezone.utc)
        exp_date = data.get("expiry_date")

        # Business rule: Never allow already-expired batch as fresh stock
        if exp_date and exp_date < now:
            raise InsufficientStockException(product["name"], 0, 0)

        batch_doc = {
            "shop_id": shop_id,
            "product_id": data["product_id"],
            "batch_number": data.get("batch_number") or f"BAT-{int(now.timestamp())}",
            "quantity_received": float(data["quantity_received"]),
            "quantity_available": float(data["quantity_received"]),
            "quantity_reserved": 0.0,
            "unit_purchase_cost": float(data["unit_purchase_cost"]),
            "purchase_date": data.get("purchase_date") or now,
            "expiry_date": exp_date,
            "supplier": data.get("supplier"),
            "notes": data.get("notes"),
            "status": "active",
            "created_at": now,
            "updated_at": now
        }

        res = self.db.inventory_batches.insert_one(batch_doc)
        batch_id = str(res.inserted_id)

        # Audit stock movement
        self.db.stock_movements.insert_one({
            "shop_id": shop_id,
            "product_id": data["product_id"],
            "batch_id": batch_id,
            "movement_type": "batch_receipt",
            "quantity_delta": float(data["quantity_received"]),
            "unit_cost_snapshot": float(data["unit_purchase_cost"]),
            "reference_type": "batch_create",
            "reference_id": batch_id,
            "created_by": user_id,
            "created_at": now
        })

        return self.get_batch_by_id(shop_id, batch_id)

    def get_batch_by_id(self, shop_id: str, batch_id: str) -> Dict[str, Any]:
        batch = self.db.inventory_batches.find_one({"_id": ObjectId(batch_id), "shop_id": shop_id})
        if not batch:
            raise EntityNotFoundException("Batch", batch_id)

        product = self.db.products.find_one({"_id": ObjectId(batch["product_id"])})
        now = datetime.now(timezone.utc)
        days_left = None
        if batch.get("expiry_date"):
            days_left = (batch["expiry_date"] - now).days

        return {
            "id": str(batch["_id"]),
            "shop_id": shop_id,
            "product_id": batch["product_id"],
            "product_name": product.get("name") if product else "Unknown",
            "batch_number": batch.get("batch_number"),
            "quantity_received": float(batch.get("quantity_received", 0.0)),
            "quantity_available": float(batch.get("quantity_available", 0.0)),
            "quantity_reserved": float(batch.get("quantity_reserved", 0.0)),
            "unit_purchase_cost": float(batch.get("unit_purchase_cost", 0.0)),
            "purchase_date": batch.get("purchase_date"),
            "expiry_date": batch.get("expiry_date"),
            "supplier": batch.get("supplier"),
            "status": batch.get("status", "active"),
            "days_until_expiry": days_left,
            "created_at": batch.get("created_at"),
            "updated_at": batch.get("updated_at")
        }

    def list_batches_for_product(self, shop_id: str, product_id: str) -> List[Dict[str, Any]]:
        batches = list(self.db.inventory_batches.find({
            "shop_id": shop_id,
            "product_id": product_id
        }).sort("created_at", -1))
        return [self.get_batch_by_id(shop_id, str(b["_id"])) for b in batches]

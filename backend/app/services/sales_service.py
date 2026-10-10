from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo.database import Database
from app.core.exceptions import EntityNotFoundException, InsufficientStockException

class SalesService:
    def __init__(self, db: Database):
        self.db = db

    def record_sale(self, shop_id: str, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        line_items_input = data.get("line_items", [])
        if not line_items_input:
            raise InsufficientStockException("No items", 0, 0)

        now = datetime.now(timezone.utc)
        sale_reference = data.get("receipt_reference") or f"SAL-{int(now.timestamp())}"

        processed_items = []
        gross_total = 0.0
        discount_total = 0.0

        # Step 1: Pre-validation of inventory for all line items
        for item in line_items_input:
            p_id = item["product_id"]
            req_qty = float(item["quantity"])
            if req_qty <= 0:
                continue

            product = self.db.products.find_one({"_id": ObjectId(p_id), "shop_id": shop_id, "is_active": True})
            if not product:
                raise EntityNotFoundException("Product", p_id)

            # Available active non-expired batches sorted by expiry ascending (FEFO)
            batches = list(self.db.inventory_batches.find({
                "shop_id": shop_id,
                "product_id": p_id,
                "status": "active",
                "quantity_available": {"$gt": 0}
            }).sort([("expiry_date", 1), ("purchase_date", 1)]))

            # Filter out expired batches
            sellable_batches = []
            total_sellable = 0.0
            for b in batches:
                exp = b.get("expiry_date")
                if exp and exp < now:
                    continue
                avail = float(b.get("quantity_available", 0.0))
                sellable_batches.append(b)
                total_sellable += avail

            if total_sellable < req_qty:
                raise InsufficientStockException(product["name"], req_qty, total_sellable)

            # Determine price
            unit_price = item.get("unit_selling_price")
            if unit_price is None or unit_price < 0:
                unit_price = float(product.get("selling_price", 0.0))

            discount = float(item.get("discount", 0.0))
            subtotal = max(0.0, (req_qty * unit_price) - discount)

            gross_total += (req_qty * unit_price)
            discount_total += discount

            # Allocate FEFO
            remaining_to_deduct = req_qty
            deductions = []

            for b in sellable_batches:
                if remaining_to_deduct <= 0:
                    break

                b_avail = float(b.get("quantity_available", 0.0))
                deduct_amount = min(b_avail, remaining_to_deduct)

                new_avail = b_avail - deduct_amount
                new_status = "exhausted" if new_avail <= 0 else "active"

                # Atomic conditional update on the batch
                update_res = self.db.inventory_batches.update_one(
                    {"_id": b["_id"], "quantity_available": {"$gte": deduct_amount}},
                    {"$inc": {"quantity_available": -deduct_amount}, "$set": {"status": new_status, "updated_at": now}}
                )

                if update_res.modified_count == 0:
                    raise InsufficientStockException(product["name"], req_qty, 0)

                deductions.append({
                    "batch_id": str(b["_id"]),
                    "batch_number": b.get("batch_number"),
                    "quantity_deducted": deduct_amount,
                    "unit_purchase_cost": float(b.get("unit_purchase_cost", 0.0))
                })

                # Record stock movement
                self.db.stock_movements.insert_one({
                    "shop_id": shop_id,
                    "product_id": p_id,
                    "batch_id": str(b["_id"]),
                    "movement_type": "sale",
                    "quantity_delta": -deduct_amount,
                    "unit_cost_snapshot": float(b.get("unit_purchase_cost", 0.0)),
                    "reference_type": "sale",
                    "reference_id": sale_reference,
                    "created_by": user_id,
                    "created_at": now
                })

                remaining_to_deduct -= deduct_amount

            processed_items.append({
                "product_id": p_id,
                "product_name": product["name"],
                "unit": product.get("unit", "unit"),
                "quantity": req_qty,
                "unit_selling_price": unit_price,
                "discount": discount,
                "subtotal": round(subtotal, 2),
                "batch_deductions": deductions
            })

        net_total = max(0.0, gross_total - discount_total)

        sale_doc = {
            "shop_id": shop_id,
            "sale_reference": sale_reference,
            "sold_at": now,
            "line_items": processed_items,
            "gross_total": round(gross_total, 2),
            "discount_total": round(discount_total, 2),
            "net_total": round(net_total, 2),
            "status": "completed",
            "created_by": user_id,
            "created_at": now
        }

        res = self.db.sales.insert_one(sale_doc)
        sale_doc["id"] = str(res.inserted_id)
        return sale_doc

    def list_sales(self, shop_id: str, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        sales = list(self.db.sales.find({"shop_id": shop_id}).sort("sold_at", -1).skip(skip).limit(limit))
        for s in sales:
            s["id"] = str(s["_id"])
        return sales

    def get_sale(self, shop_id: str, sale_id: str) -> Dict[str, Any]:
        sale = self.db.sales.find_one({"_id": ObjectId(sale_id), "shop_id": shop_id})
        if not sale:
            raise EntityNotFoundException("Sale", sale_id)
        sale["id"] = str(sale["_id"])
        return sale

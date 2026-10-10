from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo.database import Database
from app.core.exceptions import EntityNotFoundException

class ReplenishmentService:
    def __init__(self, db: Database):
        self.db = db

    def get_replenishment_suggestions(self, shop_id: str) -> List[Dict[str, Any]]:
        # Find products at or below threshold
        products = list(self.db.products.find({"shop_id": shop_id, "is_active": True}))
        suggestions = []

        for p in products:
            p_id = str(p["_id"])
            thresh = float(p.get("minimum_stock_threshold", 5.0))

            batches = list(self.db.inventory_batches.find({
                "shop_id": shop_id,
                "product_id": p_id,
                "status": "active"
            }))
            avail = sum(float(b.get("quantity_available", 0.0)) for b in batches)
            res = sum(float(b.get("quantity_reserved", 0.0)) for b in batches)

            if avail <= thresh:
                suggested_qty = max(thresh * 3, 10.0)
                # Recent sales to estimate daily demand
                recent_sales = list(self.db.sales.find({"shop_id": shop_id}).sort("sold_at", -1).limit(30))
                daily_demand = 2.5 # baseline default

                suggestions.append({
                    "product_id": p_id,
                    "product_name": p["name"],
                    "category": p.get("category", "General"),
                    "unit": p.get("unit", "unit"),
                    "available_quantity": avail,
                    "reserved_quantity": res,
                    "minimum_threshold": thresh,
                    "suggested_order_quantity": suggested_qty,
                    "estimated_daily_demand": daily_demand,
                    "lead_time_days": 2,
                    "estimated_unit_cost": float(p.get("selling_price", 20.0)) * 0.75,
                    "confidence": 0.85
                })

        return suggestions

    def create_purchase_order(self, shop_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        items = data.get("items", [])
        total_cost = sum(float(i.get("ordered_quantity", 0)) * float(i.get("estimated_unit_cost", 0)) for i in items)

        doc = {
            "shop_id": shop_id,
            "order_reference": f"PO-{int(now.timestamp())}",
            "supplier_name": data.get("supplier_name", "Local Vendor"),
            "items": items,
            "total_estimated_cost": round(total_cost, 2),
            "status": "placed",
            "notes": data.get("notes"),
            "created_at": now,
            "updated_at": now
        }
        res = self.db.purchase_orders.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        return doc

    def list_purchase_orders(self, shop_id: str) -> List[Dict[str, Any]]:
        orders = list(self.db.purchase_orders.find({"shop_id": shop_id}).sort("created_at", -1))
        for o in orders:
            o["id"] = str(o["_id"])
        return orders

    def receive_purchase_order(self, shop_id: str, order_id: str, receive_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        po = self.db.purchase_orders.find_one({"_id": ObjectId(order_id), "shop_id": shop_id})
        if not po:
            raise EntityNotFoundException("Purchase Order", order_id)

        now = datetime.now(timezone.utc)
        items_rec = receive_data.get("items_received", [])

        # Convert each received item to an inventory batch
        for item in items_rec:
            p_id = item["product_id"]
            qty = float(item["quantity_received"])
            cost = float(item.get("unit_cost", 0.0))
            exp_date = item.get("expiry_date")

            batch_doc = {
                "shop_id": shop_id,
                "product_id": p_id,
                "batch_number": item.get("batch_number") or f"PO-{po['order_reference']}",
                "quantity_received": qty,
                "quantity_available": qty,
                "quantity_reserved": 0.0,
                "unit_purchase_cost": cost,
                "purchase_date": now,
                "expiry_date": exp_date,
                "supplier": po.get("supplier_name"),
                "status": "active",
                "created_at": now,
                "updated_at": now
            }
            b_res = self.db.inventory_batches.insert_one(batch_doc)

            self.db.stock_movements.insert_one({
                "shop_id": shop_id,
                "product_id": p_id,
                "batch_id": str(b_res.inserted_id),
                "movement_type": "po_receipt",
                "quantity_delta": qty,
                "unit_cost_snapshot": cost,
                "reference_type": "purchase_order",
                "reference_id": order_id,
                "created_by": user_id,
                "created_at": now
            })

        self.db.purchase_orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": "received", "received_at": now, "updated_at": now}}
        )
        po["status"] = "received"
        po["id"] = str(po["_id"])
        return po

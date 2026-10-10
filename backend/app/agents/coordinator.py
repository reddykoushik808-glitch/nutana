from datetime import datetime, timezone
from typing import List, Dict, Any
from bson import ObjectId
from pymongo.database import Database
from app.integrations.groq_client import groq_client

class RecommendationCoordinator:
    def __init__(self, db: Database):
        self.db = db

    def generate_recommendations(self, shop_id: str) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        recommendations = []

        # 1. Freshness & Markdown Agent logic: Find batches expiring within 3-7 days
        critical_batches = list(self.db.inventory_batches.find({
            "shop_id": shop_id,
            "status": "active",
            "quantity_available": {"$gt": 0},
            "expiry_date": {"$ne": None}
        }).sort("expiry_date", 1))

        for b in critical_batches:
            exp = b["expiry_date"]
            days_left = (exp - now).days
            if 0 <= days_left <= 4:
                product = self.db.products.find_one({"_id": ObjectId(b["product_id"])})
                p_name = product["name"] if product else "Product"
                qty = b["quantity_available"]
                unit = product.get("unit", "unit") if product else "unit"

                # Check if recommendation already exists pending
                existing = self.db.recommendations.find_one({
                    "shop_id": shop_id,
                    "batch_id": str(b["_id"]),
                    "status": "pending"
                })

                if not existing:
                    rec = {
                        "shop_id": shop_id,
                        "recommendation_type": "markdown",
                        "product_id": b["product_id"],
                        "product_name": p_name,
                        "batch_id": str(b["_id"]),
                        "suggested_action": f"Apply 35% Quick Markdown on {qty} {unit} of {p_name}",
                        "evidence": f"Batch expires in {days_left} day(s) with {qty} {unit} unsold.",
                        "assumptions": "Discounted rate increases sell-through by 60% before complete spoilage.",
                        "confidence": 0.88,
                        "estimated_benefit": f"Recovers ₹{round(qty * float(b.get('unit_purchase_cost', 10)) * 0.65, 2)} cost vs total loss",
                        "status": "pending",
                        "created_at": now,
                        "updated_at": now
                    }
                    self.db.recommendations.insert_one(rec)

            elif 4 < days_left <= 7:
                product = self.db.products.find_one({"_id": ObjectId(b["product_id"])})
                p_name = product["name"] if product else "Product"
                qty = b["quantity_available"]
                unit = product.get("unit", "unit") if product else "unit"

                existing = self.db.recommendations.find_one({
                    "shop_id": shop_id,
                    "batch_id": str(b["_id"]),
                    "status": "pending"
                })
                if not existing:
                    rec = {
                        "shop_id": shop_id,
                        "recommendation_type": "transfer",
                        "product_id": b["product_id"],
                        "product_name": p_name,
                        "batch_id": str(b["_id"]),
                        "suggested_action": f"Offer surplus {qty} {unit} of {p_name} to Nearby Shop Exchange",
                        "evidence": f"Expiring in {days_left} days. Current daily sales velocity suggests store cannot deplete alone.",
                        "assumptions": "High nearby commercial demand in general food stalls and bakeries.",
                        "confidence": 0.75,
                        "estimated_benefit": "Zero spoilage loss and immediate inventory liquidity.",
                        "status": "pending",
                        "created_at": now,
                        "updated_at": now
                    }
                    self.db.recommendations.insert_one(rec)

        # 2. Replenishment Agent logic: Check products below minimum threshold with 0 reserved
        products = list(self.db.products.find({"shop_id": shop_id, "is_active": True}))
        for p in products:
            p_id = str(p["_id"])
            min_thresh = float(p.get("minimum_stock_threshold", 5.0))

            # Sum active batches
            batches = list(self.db.inventory_batches.find({
                "shop_id": shop_id,
                "product_id": p_id,
                "status": "active"
            }))
            avail = sum(float(b.get("quantity_available", 0.0)) for b in batches)

            if avail <= min_thresh:
                existing = self.db.recommendations.find_one({
                    "shop_id": shop_id,
                    "product_id": p_id,
                    "recommendation_type": "replenishment",
                    "status": "pending"
                })
                if not existing:
                    order_qty = max(min_thresh * 3, 10.0)
                    rec = {
                        "shop_id": shop_id,
                        "recommendation_type": "replenishment",
                        "product_id": p_id,
                        "product_name": p["name"],
                        "batch_id": None,
                        "suggested_action": f"Reorder {order_qty} {p.get('unit', 'units')} of {p['name']}",
                        "evidence": f"Current stock is {avail} {p.get('unit', 'units')} (threshold: {min_thresh}).",
                        "assumptions": "Standard 2-day supplier delivery window to prevent out-of-stock lost sales.",
                        "confidence": 0.90,
                        "estimated_benefit": "Avoid lost sales and customer churn.",
                        "status": "pending",
                        "created_at": now,
                        "updated_at": now
                    }
                    self.db.recommendations.insert_one(rec)

        # Fetch all pending recommendations
        return self.list_recommendations(shop_id)

    def list_recommendations(self, shop_id: str) -> List[Dict[str, Any]]:
        recs = list(self.db.recommendations.find({"shop_id": shop_id}).sort("created_at", -1))
        for r in recs:
            r["id"] = str(r["_id"])
        return recs

    def handle_decision(self, shop_id: str, rec_id: str, decision: str, notes: str = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        rec = self.db.recommendations.find_one({"_id": ObjectId(rec_id), "shop_id": shop_id})
        if not rec:
            raise Exception("Recommendation not found")

        self.db.recommendations.update_one(
            {"_id": ObjectId(rec_id)},
            {"$set": {"status": decision, "notes": notes, "updated_at": now}}
        )

        # Audit feedback
        self.db.feedback.insert_one({
            "shop_id": shop_id,
            "recommendation_id": rec_id,
            "decision": decision,
            "comment": notes,
            "rating": 5 if decision == "approved" else 3,
            "created_at": now
        })

        rec["status"] = decision
        rec["id"] = str(rec["_id"])
        return rec

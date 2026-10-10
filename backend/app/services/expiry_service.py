from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from bson import ObjectId
from pymongo.database import Database

class ExpiryService:
    def __init__(self, db: Database):
        self.db = db

    def get_expiry_alerts(self, shop_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        shop = self.db.shops.find_one({"_id": ObjectId(shop_id)}) or {}
        critical_days = shop.get("expiry_critical_days", 3)
        warning_days = shop.get("expiry_warning_days", 7)

        batches = list(self.db.inventory_batches.find({
            "shop_id": shop_id,
            "quantity_available": {"$gt": 0},
            "expiry_date": {"$ne": None}
        }).sort("expiry_date", 1))

        expired_list = []
        critical_list = []
        warning_list = []
        low_risk_list = []

        for b in batches:
            exp: datetime = b["expiry_date"]
            product = self.db.products.find_one({"_id": ObjectId(b["product_id"])})
            p_name = product.get("name", "Unknown") if product else "Unknown"

            days_remaining = (exp - now).days
            batch_val = round(float(b.get("quantity_available", 0.0)) * float(b.get("unit_purchase_cost", 0.0)), 2)

            item = {
                "batch_id": str(b["_id"]),
                "product_id": b["product_id"],
                "product_name": p_name,
                "batch_number": b.get("batch_number"),
                "remaining_quantity": float(b.get("quantity_available", 0.0)),
                "unit": product.get("unit", "unit") if product else "unit",
                "expiry_date": exp,
                "days_remaining": days_remaining,
                "batch_cost_value": batch_val,
            }

            if days_remaining < 0:
                item["risk_level"] = "Expired"
                item["suggested_action"] = "Write off or remove immediately to avoid contamination"
                expired_list.append(item)
            elif days_remaining <= critical_days:
                item["risk_level"] = "Critical"
                item["suggested_action"] = "Flash markdown 30-50% or transfer to nearby partner shop"
                critical_list.append(item)
            elif days_remaining <= warning_days:
                item["risk_level"] = "Expiring Soon"
                item["suggested_action"] = "Feature in front shelf or apply 10-20% bundle discount"
                warning_list.append(item)
            else:
                item["risk_level"] = "Low Risk"
                item["suggested_action"] = "Standard FEFO rotation"
                low_risk_list.append(item)

        total_spoilage_exposure = sum(i["batch_cost_value"] for i in expired_list + critical_list)

        return {
            "summary": {
                "total_expired_count": len(expired_list),
                "total_critical_count": len(critical_list),
                "total_warning_count": len(warning_list),
                "total_low_risk_count": len(low_risk_list),
                "estimated_spoilage_exposure": total_spoilage_exposure,
            },
            "expired": expired_list,
            "critical": critical_list,
            "warning": warning_list,
            "low_risk": low_risk_list
        }

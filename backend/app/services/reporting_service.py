from datetime import datetime, timezone
from typing import Dict, Any, List
from bson import ObjectId
from pymongo.database import Database

class ReportingService:
    def __init__(self, db: Database):
        self.db = db

    def get_dashboard_summary(self, shop_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # 1. Total products
        total_products = self.db.products.count_documents({"shop_id": shop_id, "is_active": True})

        # 2. Batches
        batches = list(self.db.inventory_batches.find({"shop_id": shop_id, "status": "active"}))
        total_units = sum(float(b.get("quantity_available", 0.0)) for b in batches)
        inventory_cost = sum(float(b.get("quantity_available", 0.0)) * float(b.get("unit_purchase_cost", 0.0)) for b in batches)

        # 3. Today's sales
        today_sales = list(self.db.sales.find({
            "shop_id": shop_id,
            "sold_at": {"$gte": start_of_day}
        }))
        today_sales_val = sum(float(s.get("net_total", 0.0)) for s in today_sales)

        # 4. Expiry counts
        shop = self.db.shops.find_one({"_id": ObjectId(shop_id)}) or {}
        warn_days = shop.get("expiry_warning_days", 7)
        expiring_soon_count = 0
        high_risk_exposure = 0.0

        for b in batches:
            exp = b.get("expiry_date")
            if exp:
                days_left = (exp - now).days
                if days_left <= warn_days:
                    expiring_soon_count += 1
                if days_left <= 3:
                    high_risk_exposure += float(b.get("quantity_available", 0.0)) * float(b.get("unit_purchase_cost", 0.0))

        # 5. Low stock count
        products = list(self.db.products.find({"shop_id": shop_id, "is_active": True}))
        low_stock_count = 0
        for p in products:
            thresh = float(p.get("minimum_stock_threshold", 5.0))
            p_batches = [b for b in batches if b.get("product_id") == str(p["_id"])]
            p_avail = sum(float(b.get("quantity_available", 0.0)) for b in p_batches)
            if p_avail <= thresh:
                low_stock_count += 1

        # 6. Pending recommendations
        pending_recs = self.db.recommendations.count_documents({"shop_id": shop_id, "status": "pending"})

        # 7. Recent activity (sales and batches)
        recent_sales = list(self.db.sales.find({"shop_id": shop_id}).sort("sold_at", -1).limit(4))
        recent_activity = []
        for s in recent_sales:
            recent_activity.append({
                "title": f"Sale recorded ({s.get('sale_reference')})",
                "subtitle": f"{len(s.get('line_items', []))} item(s) • ₹{s.get('net_total')}",
                "timestamp": s.get("sold_at")
            })

        return {
            "total_products": total_products,
            "total_available_units": round(total_units, 2),
            "inventory_cost_value": round(inventory_cost, 2),
            "today_sales": round(today_sales_val, 2),
            "expiring_soon_count": expiring_soon_count,
            "estimated_spoilage_exposure": round(high_risk_exposure, 2),
            "low_stock_count": low_stock_count,
            "pending_recommendations": pending_recs,
            "recent_activity": recent_activity
        }

    def get_sales_analytics(self, shop_id: str) -> List[Dict[str, Any]]:
        # Aggregate last 7 days sales
        sales = list(self.db.sales.find({"shop_id": shop_id}).sort("sold_at", -1).limit(100))
        # Group by date
        daily: Dict[str, float] = {}
        for s in sales:
            dt: datetime = s.get("sold_at")
            if dt:
                d_str = dt.strftime("%d %b")
                daily[d_str] = daily.get(d_str, 0.0) + float(s.get("net_total", 0.0))

        result = [{"date": k, "amount": round(v, 2)} for k, v in daily.items()]
        return list(reversed(result)) if result else []

    def get_category_distribution(self, shop_id: str) -> List[Dict[str, Any]]:
        products = list(self.db.products.find({"shop_id": shop_id, "is_active": True}))
        counts: Dict[str, int] = {}
        for p in products:
            cat = p.get("category", "General")
            counts[cat] = counts.get(cat, 0) + 1
        return [{"category": k, "count": v} for k, v in counts.items()]

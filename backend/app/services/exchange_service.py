from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo.database import Database
from app.core.exceptions import EntityNotFoundException, InvalidStateTransitionException, InsufficientStockException

class ExchangeService:
    def __init__(self, db: Database):
        self.db = db

    def list_other_shops(self, current_shop_id: str, search: Optional[str] = None) -> List[Dict[str, Any]]:
        # Non-map participating shops discovery with strictly non-private shared data
        query = {"_id": {"$ne": ObjectId(current_shop_id)}}
        if search:
            query["name"] = {"$regex": search, "$options": "i"}

        shops = list(self.db.shops.find(query).limit(50))
        results = []
        for s in shops:
            s_id = str(s["_id"])
            # Count public offers
            offer_count = self.db.exchanges.count_documents({
                "sender_shop_id": s_id,
                "status": "draft"
            })
            results.append({
                "id": s_id,
                "name": s["name"],
                "shop_type": s.get("shop_type", "Kirana Store"),
                "locality": s.get("locality") or s.get("city", "Local Market"),
                "active_offers_count": offer_count
            })
        return results

    def create_offer(self, shop_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        p_id = data["product_id"]
        qty = float(data["quantity"])
        price = float(data["asking_price"])

        product = self.db.products.find_one({"_id": ObjectId(p_id), "shop_id": shop_id})
        if not product:
            raise EntityNotFoundException("Product", p_id)

        # Ensure shop has enough available stock
        batches = list(self.db.inventory_batches.find({
            "shop_id": shop_id,
            "product_id": p_id,
            "status": "active"
        }))
        avail = sum(float(b.get("quantity_available", 0.0)) for b in batches)
        if avail < qty:
            raise InsufficientStockException(product["name"], qty, avail)

        now = datetime.now(timezone.utc)
        offer_doc = {
            "sender_shop_id": shop_id,
            "receiver_shop_id": None,
            "product_id": p_id,
            "product_name": product["name"],
            "unit": product.get("unit", "unit"),
            "quantity": qty,
            "agreed_price": price,
            "total_amount": round(qty * price, 2),
            "status": "draft", # public offer
            "terms": data.get("notes"),
            "created_at": now,
            "updated_at": now
        }
        res = self.db.exchanges.insert_one(offer_doc)
        offer_doc["id"] = str(res.inserted_id)
        return offer_doc

    def list_public_offers(self, current_shop_id: str) -> List[Dict[str, Any]]:
        # Shows offers made by other shops
        offers = list(self.db.exchanges.find({
            "sender_shop_id": {"$ne": current_shop_id},
            "status": "draft"
        }).sort("created_at", -1))

        results = []
        for o in offers:
            s = self.db.shops.find_one({"_id": ObjectId(o["sender_shop_id"])})
            sender_name = s.get("name") if s else "Partner Store"
            results.append({
                "id": str(o["_id"]),
                "sender_shop_id": o["sender_shop_id"],
                "sender_shop_name": sender_name,
                "receiver_shop_id": "",
                "receiver_shop_name": "",
                "product_id": o["product_id"],
                "product_name": o["product_name"],
                "quantity": o["quantity"],
                "unit": o.get("unit", "unit"),
                "agreed_price": o["agreed_price"],
                "total_amount": o["total_amount"],
                "status": o["status"],
                "terms": o.get("terms"),
                "created_at": o["created_at"],
                "updated_at": o["updated_at"]
            })
        return results

    def request_transfer(self, receiver_shop_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        target_shop_id = data["target_shop_id"]
        p_id = data["product_id"]
        qty = float(data["quantity"])
        price = float(data["offered_price"])

        target_product = self.db.products.find_one({"_id": ObjectId(p_id), "shop_id": target_shop_id})
        if not target_product:
            raise EntityNotFoundException("Target Product", p_id)

        now = datetime.now(timezone.utc)
        req_doc = {
            "sender_shop_id": target_shop_id,
            "receiver_shop_id": receiver_shop_id,
            "product_id": p_id,
            "product_name": target_product["name"],
            "unit": target_product.get("unit", "unit"),
            "quantity": qty,
            "agreed_price": price,
            "total_amount": round(qty * price, 2),
            "status": "requested",
            "terms": data.get("terms"),
            "created_at": now,
            "updated_at": now
        }
        res = self.db.exchanges.insert_one(req_doc)
        req_doc["id"] = str(res.inserted_id)
        return req_doc

    def list_shop_transactions(self, shop_id: str) -> List[Dict[str, Any]]:
        # All exchanges where shop is sender or receiver
        txs = list(self.db.exchanges.find({
            "$or": [
                {"sender_shop_id": shop_id},
                {"receiver_shop_id": shop_id}
            ]
        }).sort("created_at", -1))

        results = []
        for t in txs:
            s_sender = self.db.shops.find_one({"_id": ObjectId(t["sender_shop_id"])})
            s_rec = self.db.shops.find_one({"_id": ObjectId(t["receiver_shop_id"])}) if t.get("receiver_shop_id") else None

            results.append({
                "id": str(t["_id"]),
                "sender_shop_id": t["sender_shop_id"],
                "sender_shop_name": s_sender.get("name", "Unknown Shop") if s_sender else "Shop",
                "receiver_shop_id": t.get("receiver_shop_id", ""),
                "receiver_shop_name": s_rec.get("name", "Marketplace Offer") if s_rec else "Open Market",
                "product_id": t["product_id"],
                "product_name": t["product_name"],
                "quantity": t["quantity"],
                "unit": t.get("unit", "unit"),
                "agreed_price": t["agreed_price"],
                "total_amount": t["total_amount"],
                "status": t["status"],
                "terms": t.get("terms"),
                "created_at": t["created_at"],
                "updated_at": t["updated_at"]
            })
        return results

    def accept_transaction(self, shop_id: str, tx_id: str) -> Dict[str, Any]:
        tx = self.db.exchanges.find_one({"_id": ObjectId(tx_id), "sender_shop_id": shop_id})
        if not tx:
            raise EntityNotFoundException("Transaction", tx_id)
        if tx["status"] != "requested":
            raise InvalidStateTransitionException(tx["status"], "accept")

        # Reserve stock from sender batches
        p_id = tx["product_id"]
        needed_qty = float(tx["quantity"])
        batches = list(self.db.inventory_batches.find({
            "shop_id": shop_id,
            "product_id": p_id,
            "status": "active",
            "quantity_available": {"$gt": 0}
        }).sort("expiry_date", 1))

        total_avail = sum(float(b.get("quantity_available", 0.0)) for b in batches)
        if total_avail < needed_qty:
            raise InsufficientStockException(tx["product_name"], needed_qty, total_avail)

        now = datetime.now(timezone.utc)
        # Lock reservation
        rem = needed_qty
        reservations = []
        for b in batches:
            if rem <= 0:
                break
            b_avail = float(b["quantity_available"])
            res_amt = min(b_avail, rem)

            self.db.inventory_batches.update_one(
                {"_id": b["_id"], "quantity_available": {"$gte": res_amt}},
                {"$inc": {"quantity_available": -res_amt, "quantity_reserved": res_amt}, "$set": {"updated_at": now}}
            )
            reservations.append({"batch_id": str(b["_id"]), "reserved_qty": res_amt})
            rem -= res_amt

        self.db.exchanges.update_one(
            {"_id": ObjectId(tx_id)},
            {"$set": {"status": "accepted", "reservation_details": reservations, "updated_at": now}}
        )
        return self.get_transaction(tx_id)

    def reject_transaction(self, shop_id: str, tx_id: str) -> Dict[str, Any]:
        tx = self.db.exchanges.find_one({"_id": ObjectId(tx_id), "sender_shop_id": shop_id})
        if not tx:
            raise EntityNotFoundException("Transaction", tx_id)
        if tx["status"] != "requested":
            raise InvalidStateTransitionException(tx["status"], "reject")

        now = datetime.now(timezone.utc)
        self.db.exchanges.update_one(
            {"_id": ObjectId(tx_id)},
            {"$set": {"status": "rejected", "updated_at": now}}
        )
        return self.get_transaction(tx_id)

    def confirm_handover(self, shop_id: str, tx_id: str) -> Dict[str, Any]:
        tx = self.db.exchanges.find_one({"_id": ObjectId(tx_id)})
        if not tx:
            raise EntityNotFoundException("Transaction", tx_id)
        if tx["status"] not in ["accepted", "ready_for_handover"]:
            raise InvalidStateTransitionException(tx["status"], "confirm-handover")

        # Either sender or receiver can trigger handover confirmation
        now = datetime.now(timezone.utc)
        # Finalize stock: deduct reserved stock from sender batches
        reservations = tx.get("reservation_details", [])
        for r in reservations:
            b_id = r["batch_id"]
            qty = r["reserved_qty"]
            self.db.inventory_batches.update_one(
                {"_id": ObjectId(b_id)},
                {"$inc": {"quantity_reserved": -qty}, "$set": {"updated_at": now}}
            )

        self.db.exchanges.update_one(
            {"_id": ObjectId(tx_id)},
            {"$set": {"status": "completed", "completed_at": now, "updated_at": now}}
        )
        return self.get_transaction(tx_id)

    def get_transaction(self, tx_id: str) -> Dict[str, Any]:
        t = self.db.exchanges.find_one({"_id": ObjectId(tx_id)})
        if not t:
            raise EntityNotFoundException("Transaction", tx_id)
        s_sender = self.db.shops.find_one({"_id": ObjectId(t["sender_shop_id"])})
        s_rec = self.db.shops.find_one({"_id": ObjectId(t["receiver_shop_id"])}) if t.get("receiver_shop_id") else None

        return {
            "id": str(t["_id"]),
            "sender_shop_id": t["sender_shop_id"],
            "sender_shop_name": s_sender.get("name", "Shop") if s_sender else "Shop",
            "receiver_shop_id": t.get("receiver_shop_id", ""),
            "receiver_shop_name": s_rec.get("name", "Shop") if s_rec else "Open Market",
            "product_id": t["product_id"],
            "product_name": t["product_name"],
            "quantity": t["quantity"],
            "unit": t.get("unit", "unit"),
            "agreed_price": t["agreed_price"],
            "total_amount": t["total_amount"],
            "status": t["status"],
            "terms": t.get("terms"),
            "created_at": t["created_at"],
            "updated_at": t["updated_at"]
        }

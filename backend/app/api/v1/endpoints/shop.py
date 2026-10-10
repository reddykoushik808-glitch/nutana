from fastapi import APIRouter, Depends
from pymongo.database import Database
from app.api.dependencies import get_db, get_current_shop
from app.schemas.schemas import ShopUpdate, ShopResponse

router = APIRouter(prefix="/shop", tags=["shop"])

@router.get("", response_model=ShopResponse)
def get_shop(shop: dict = Depends(get_current_shop)):
    return {
        "id": str(shop["_id"]),
        "name": shop["name"],
        "shop_type": shop.get("shop_type", "Kirana Store"),
        "owner_user_id": shop.get("owner_user_id", ""),
        "contact_phone": shop.get("contact_phone"),
        "address": shop.get("address"),
        "city": shop.get("city"),
        "state": shop.get("state"),
        "pincode": shop.get("pincode"),
        "timezone": shop.get("timezone", "Asia/Kolkata"),
        "currency": shop.get("currency", "INR"),
        "expiry_warning_days": shop.get("expiry_warning_days", 7),
        "expiry_critical_days": shop.get("expiry_critical_days", 3),
        "created_at": shop["created_at"],
        "updated_at": shop.get("updated_at", shop["created_at"])
    }

@router.patch("", response_model=ShopResponse)
def update_shop(payload: ShopUpdate, shop: dict = Depends(get_current_shop), db: Database = Depends(get_db)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if update_data:
        db.shops.update_one({"_id": shop["_id"]}, {"$set": update_data})
        shop.update(update_data)

    return get_shop(shop)

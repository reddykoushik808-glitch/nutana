from fastapi import APIRouter, Depends
from pymongo.database import Database
from app.api.dependencies import get_db, get_current_shop
from app.services.expiry_service import ExpiryService

router = APIRouter(prefix="/expiry", tags=["expiry"])

@router.get("/alerts")
def get_expiry_alerts(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExpiryService(db)
    return service.get_expiry_alerts(str(shop["_id"]))

from fastapi import APIRouter, Depends, status
from pymongo.database import Database
from typing import List
from app.api.dependencies import get_db, get_current_shop, get_current_user
from app.services.replenishment_service import ReplenishmentService
from app.schemas.schemas import PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderReceive

router = APIRouter(tags=["replenishment"])

@router.get("/replenishment/suggestions")
def get_replenishment_suggestions(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ReplenishmentService(db)
    return service.get_replenishment_suggestions(str(shop["_id"]))

@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ReplenishmentService(db)
    return service.create_purchase_order(str(shop["_id"]), payload.dict())

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ReplenishmentService(db)
    return service.list_purchase_orders(str(shop["_id"]))

@router.post("/purchase-orders/{order_id}/receive", response_model=PurchaseOrderResponse)
def receive_purchase_order(
    order_id: str,
    payload: PurchaseOrderReceive,
    shop: dict = Depends(get_current_shop),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    service = ReplenishmentService(db)
    return service.receive_purchase_order(str(shop["_id"]), order_id, payload.dict(), str(current_user["_id"]))

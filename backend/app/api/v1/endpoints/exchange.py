from fastapi import APIRouter, Depends, Query, status
from pymongo.database import Database
from typing import Optional, List
from app.api.dependencies import get_db, get_current_shop
from app.services.exchange_service import ExchangeService
from app.schemas.schemas import ExchangeOfferCreate, ExchangeRequestCreate, TransactionResponse

router = APIRouter(tags=["exchange"])

@router.get("/exchange/shops")
def get_exchange_shops(
    search: Optional[str] = Query(None),
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.list_other_shops(str(shop["_id"]), search=search)

@router.get("/exchange/offers")
def get_public_offers(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.list_public_offers(str(shop["_id"]))

@router.post("/exchange/offers", status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: ExchangeOfferCreate,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.create_offer(str(shop["_id"]), payload.dict())

@router.post("/exchange/requests", status_code=status.HTTP_201_CREATED)
def request_transfer(
    payload: ExchangeRequestCreate,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.request_transfer(str(shop["_id"]), payload.dict())

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.list_shop_transactions(str(shop["_id"]))

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.get_transaction(transaction_id)

@router.post("/transactions/{transaction_id}/accept", response_model=TransactionResponse)
def accept_transaction(
    transaction_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.accept_transaction(str(shop["_id"]), transaction_id)

@router.post("/transactions/{transaction_id}/reject", response_model=TransactionResponse)
def reject_transaction(
    transaction_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.reject_transaction(str(shop["_id"]), transaction_id)

@router.post("/transactions/{transaction_id}/confirm-handover", response_model=TransactionResponse)
def confirm_handover(
    transaction_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ExchangeService(db)
    return service.confirm_handover(str(shop["_id"]), transaction_id)

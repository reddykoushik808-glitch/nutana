from fastapi import APIRouter, Depends, Query, status
from pymongo.database import Database
from typing import List
from app.api.dependencies import get_db, get_current_shop, get_current_user
from app.services.sales_service import SalesService
from app.schemas.schemas import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["sales"])

@router.get("", response_model=List[SaleResponse])
def list_sales(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = SalesService(db)
    return service.list_sales(str(shop["_id"]), limit=limit, skip=skip)

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def record_sale(
    payload: SaleCreate,
    shop: dict = Depends(get_current_shop),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    service = SalesService(db)
    return service.record_sale(str(shop["_id"]), payload.dict(), str(current_user["_id"]))

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = SalesService(db)
    return service.get_sale(str(shop["_id"]), sale_id)

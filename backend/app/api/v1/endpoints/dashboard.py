from fastapi import APIRouter, Depends
from pymongo.database import Database
from app.api.dependencies import get_db, get_current_shop
from app.services.reporting_service import ReportingService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def get_dashboard_summary(shop: dict = Depends(get_current_shop), db: Database = Depends(get_db)):
    service = ReportingService(db)
    return service.get_dashboard_summary(str(shop["_id"]))

@router.get("/sales")
def get_dashboard_sales(shop: dict = Depends(get_current_shop), db: Database = Depends(get_db)):
    service = ReportingService(db)
    return service.get_sales_analytics(str(shop["_id"]))

@router.get("/inventory")
def get_dashboard_inventory(shop: dict = Depends(get_current_shop), db: Database = Depends(get_db)):
    service = ReportingService(db)
    return service.get_category_distribution(str(shop["_id"]))

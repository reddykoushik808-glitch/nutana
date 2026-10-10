from fastapi import APIRouter, Depends, Response
from pymongo.database import Database
import csv
import io
from app.api.dependencies import get_db, get_current_shop
from app.services.reporting_service import ReportingService
from app.schemas.schemas import FeedbackCreate

router = APIRouter(tags=["reports_and_feedback"])

@router.get("/reports/sales")
def get_sales_report(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ReportingService(db)
    return service.get_sales_analytics(str(shop["_id"]))

@router.get("/reports/inventory")
def get_inventory_report(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = ReportingService(db)
    return service.get_category_distribution(str(shop["_id"]))

@router.get("/reports/export")
def export_inventory_csv(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    # Safe CSV export avoiding formula injection (e.g. prefixing '=', '+', '-', '@' with single quote)
    products = list(db.products.find({"shop_id": str(shop["_id"]), "is_active": True}))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Product Name", "Category", "Unit", "Selling Price", "Threshold"])

    for p in products:
        name = str(p.get("name", ""))
        if name and name[0] in ("=", "+", "-", "@"):
            name = "'" + name
        writer.writerow([
            name,
            p.get("category", ""),
            p.get("unit", ""),
            p.get("selling_price", 0.0),
            p.get("minimum_stock_threshold", 0.0)
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nutana_inventory.csv"}
    )

@router.post("/feedback")
def submit_feedback(
    payload: FeedbackCreate,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    doc = payload.dict()
    doc["shop_id"] = str(shop["_id"])
    db.feedback.insert_one(doc)
    return {"message": "Feedback recorded successfully"}

@router.get("/feedback")
def list_feedback(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    feedbacks = list(db.feedback.find({"shop_id": str(shop["_id"])}).sort("created_at", -1))
    for f in feedbacks:
        f["id"] = str(f["_id"])
    return feedbacks

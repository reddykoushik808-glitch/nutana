from fastapi import APIRouter, Depends, Query, status
from pymongo.database import Database
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from app.api.dependencies import get_db, get_current_shop, get_current_user
from app.services.inventory_service import InventoryService
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse, BatchCreate, BatchAdjustment, BatchResponse

router = APIRouter(tags=["products"])

@router.get("/products", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = InventoryService(db)
    return service.list_products(str(shop["_id"]), category=category, search=search, status_filter=status)

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    shop_id_str = str(shop["_id"])
    now = datetime.now(timezone.utc)
    doc = {
        "shop_id": shop_id_str,
        "name": payload.name.strip(),
        "normalized_name": payload.name.strip().lower(),
        "sku": payload.sku.strip() if payload.sku else None,
        "barcode": payload.barcode.strip() if payload.barcode else None,
        "category": payload.category,
        "brand": payload.brand,
        "unit": payload.unit,
        "selling_price": payload.selling_price,
        "minimum_stock_threshold": payload.minimum_stock_threshold,
        "notes": payload.notes,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    res = db.products.insert_one(doc)
    service = InventoryService(db)
    return service.get_product(shop_id_str, str(res.inserted_id))

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = InventoryService(db)
    return service.get_product(str(shop["_id"]), product_id)

@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if "name" in update_data:
        update_data["normalized_name"] = update_data["name"].strip().lower()
    update_data["updated_at"] = datetime.now(timezone.utc)

    db.products.update_one(
        {"_id": ObjectId(product_id), "shop_id": str(shop["_id"])},
        {"$set": update_data}
    )
    service = InventoryService(db)
    return service.get_product(str(shop["_id"]), product_id)

@router.get("/products/{product_id}/batches", response_model=List[BatchResponse])
def get_product_batches(
    product_id: str,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    service = InventoryService(db)
    return service.list_batches_for_product(str(shop["_id"]), product_id)

@router.post("/products/{product_id}/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def add_product_batch(
    product_id: str,
    payload: BatchCreate,
    shop: dict = Depends(get_current_shop),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    service = InventoryService(db)
    data = payload.dict()
    data["product_id"] = product_id
    return service.create_batch(str(shop["_id"]), data, str(current_user["_id"]))

@router.post("/batches/{batch_id}/adjustments", response_model=BatchResponse)
def adjust_batch(
    batch_id: str,
    payload: BatchAdjustment,
    shop: dict = Depends(get_current_shop),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    delta = payload.quantity_delta

    db.inventory_batches.update_one(
        {"_id": ObjectId(batch_id), "shop_id": str(shop["_id"])},
        {"$inc": {"quantity_available": delta}, "$set": {"updated_at": now}}
    )

    batch = db.inventory_batches.find_one({"_id": ObjectId(batch_id)})
    db.stock_movements.insert_one({
        "shop_id": str(shop["_id"]),
        "product_id": batch["product_id"],
        "batch_id": batch_id,
        "movement_type": payload.adjustment_type,
        "quantity_delta": delta,
        "unit_cost_snapshot": batch.get("unit_purchase_cost", 0.0),
        "reference_type": "manual_adjustment",
        "reference_id": payload.reason,
        "created_by": str(current_user["_id"]),
        "created_at": now
    })

    service = InventoryService(db)
    return service.get_batch_by_id(str(shop["_id"]), batch_id)

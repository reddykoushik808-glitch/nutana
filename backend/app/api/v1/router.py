from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    shop,
    dashboard,
    products,
    sales,
    expiry,
    recommendations,
    exchange,
    replenishment,
    reports
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(shop.router)
api_router.include_router(dashboard.router)
api_router.include_router(products.router)
api_router.include_router(sales.router)
api_router.include_router(expiry.router)
api_router.include_router(recommendations.router)
api_router.include_router(exchange.router)
api_router.include_router(replenishment.router)
api_router.include_router(reports.router)

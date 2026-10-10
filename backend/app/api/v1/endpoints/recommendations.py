from fastapi import APIRouter, Depends
from pymongo.database import Database
from typing import List
from app.api.dependencies import get_db, get_current_shop
from app.agents.coordinator import RecommendationCoordinator
from app.schemas.schemas import RecommendationResponse, RecommendationDecision

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    coordinator = RecommendationCoordinator(db)
    return coordinator.list_recommendations(str(shop["_id"]))

@router.post("/generate", response_model=List[RecommendationResponse])
def generate_recommendations(
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    coordinator = RecommendationCoordinator(db)
    return coordinator.generate_recommendations(str(shop["_id"]))

@router.post("/{recommendation_id}/decision", response_model=RecommendationResponse)
def decide_recommendation(
    recommendation_id: str,
    payload: RecommendationDecision,
    shop: dict = Depends(get_current_shop),
    db: Database = Depends(get_db)
):
    coordinator = RecommendationCoordinator(db)
    return coordinator.handle_decision(str(shop["_id"]), recommendation_id, payload.decision, payload.notes)

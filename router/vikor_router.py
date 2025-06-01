from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.database import get_db
from models import Product, ProductRanking
from schemas.product_ranking_schema import ProductRankingSchema
import controllers.vikor_controller as favorit_controller
import controllers.survey_controller as secondary_controller

router = APIRouter()


@router.post("/calculate")
def calculate_vikor(db: Session = Depends(get_db)):
    try:
        controller = favorit_controller.VikorController(db)
        secondary_controller.update_surveys_response_from_sheet(controller.db)
        results = controller.calculate_rankings()
        return {"message": "VIKOR rankings calculated successfully", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rankings", response_model=List[ProductRankingSchema])
def get_rankings(db: Session = Depends(get_db)):
    rankings = db.query(ProductRanking).join(Product).order_by(ProductRanking.rank).all()

    result = []
    for r in rankings:
        result.append({
            "product_id": r.product_id,
            "score": float(r.score),
            "rank": r.rank,
            "evaluated_at": r.evaluated_at,
            "name": r.product.name if r.product else None
        })
    return result

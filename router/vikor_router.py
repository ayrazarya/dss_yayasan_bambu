# ============ ROUTER FILE ============

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
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
        import traceback
        print("ERROR:", traceback.format_exc())  # Bisa ganti ke logger.error
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rankings", response_model=List[ProductRankingSchema])
def get_rankings(db: Session = Depends(get_db)):
    """Mendapatkan ranking terbaru"""
    controller = favorit_controller.VikorController(db)
    rankings = controller.get_latest_rankings()

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


@router.get("/rankings/history", response_model=List[ProductRankingSchema])
def get_rankings_history(
        limit: Optional[int] = Query(None, description="Batasi jumlah record yang dikembalikan"),
        db: Session = Depends(get_db)
):
    """Mendapatkan history semua perhitungan ranking"""
    controller = favorit_controller.VikorController(db)
    rankings = controller.get_rankings_history(limit=limit)

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


@router.get("/rankings/dates")
def get_evaluation_dates(db: Session = Depends(get_db)):
    """Mendapatkan daftar tanggal evaluasi yang tersedia"""
    dates = (db.query(ProductRanking.evaluated_at)
             .distinct()
             .order_by(ProductRanking.evaluated_at.desc())
             .all())

    return [{"evaluated_at": date[0]} for date in dates]


@router.get("/rankings/by-date/{evaluation_date}", response_model=List[ProductRankingSchema])
def get_rankings_by_date(
        evaluation_date: datetime,
        db: Session = Depends(get_db)
):
    """Mendapatkan ranking berdasarkan tanggal evaluasi tertentu"""
    controller = favorit_controller.VikorController(db)
    rankings = controller.get_rankings_by_date(evaluation_date)

    if not rankings:
        raise HTTPException(status_code=404, detail="Tidak ada data ranking untuk tanggal tersebut")

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
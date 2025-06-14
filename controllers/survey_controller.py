from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from models import MarketSurvey, SurveyResponse

from schemas.market_surveys_schema import MarketSurveyCreate, MarketSurveyUpdate
from schemas.survey_responses_schema import SurveyResponseCreate, SurveyResponseUpdate
from utils.sheets_service import SheetService
import logging

logger = logging.getLogger(__name__)

# MarketSurvey Logic
def create_market_survey(db: Session, survey: MarketSurveyCreate) -> MarketSurvey:
    db_survey = MarketSurvey(product_id = survey.product_id, form_response_id = survey.form_response_id)
    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)
    return db_survey


def get_all_market_surveys(db: Session) -> List[MarketSurvey]:
    return db.query(MarketSurvey).all()


def get_market_survey(db: Session, survey_id: int) -> MarketSurvey:
    survey = db.query(MarketSurvey).filter(MarketSurvey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


def update_market_survey(db: Session, survey_id: int, survey_update: MarketSurveyUpdate) -> MarketSurvey:
    survey = db.query(MarketSurvey).filter(MarketSurvey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    for key, value in survey_update.model_dump(exclude_unset=True).items():
        setattr(survey, key, value)
    db.commit()
    db.refresh(survey)
    return survey


def delete_market_survey(db: Session, survey_id: int) -> None:
    survey = db.query(MarketSurvey).filter(MarketSurvey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    db.delete(survey)
    db.commit()

def update_surveys_response_from_sheet(db:Session) -> None:
    surveys = get_all_market_surveys(db)
    for survey in surveys:
        survey_id = survey.survey_id
        update_responses_from_sheet(db, survey_id)

# SurveyResponse Logic
def create_survey_response(db: Session, response: SurveyResponseCreate) -> SurveyResponse:
    db_response = SurveyResponse(**response.model_dump())
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response


def get_all_survey_responses(db: Session) -> List[SurveyResponse]:
    return db.query(SurveyResponse).all()


def get_survey_response(db: Session, response_id: int) -> SurveyResponse:
    response = db.query(SurveyResponse).filter(SurveyResponse.response_id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    return response


def update_survey_response(db: Session, response_id: int, response_update: SurveyResponseUpdate) -> SurveyResponse:
    response = db.query(SurveyResponse).filter(SurveyResponse.response_id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    for key, value in response_update.model_dump(exclude_unset=True).items():
        setattr(response, key, value)
    db.commit()
    db.refresh(response)
    return response


def delete_survey_response(db: Session, response_id: int) -> None:
    response = db.query(SurveyResponse).filter(SurveyResponse.response_id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    db.delete(response)
    db.commit()

def update_responses_from_sheet(db: Session, survey_id: int) -> None:
    logger.info(f"Starting update for survey {survey_id}")
    survey: Optional[MarketSurvey] = db.query(MarketSurvey).get(survey_id)
    
    # Explicit check for None and form_id
    if survey is None:
        logger.error(f"Survey {survey_id} not found")
        raise ValueError(f"Survey {survey_id} not found")
    if not survey.form_response_id:
        logger.error(f"Survey {survey_id} has no form ID")
        raise ValueError(f"Survey {survey_id} has no form ID")

    service = SheetService()
    logger.info("Fetching sheet responses...")
    sheet_responses = service.get_form_responses(survey.form_response_id)
    logger.info(f"Found {len(sheet_responses)} responses in sheet")
    try:
        for response in sheet_responses:
            existing = get_response_by_fingerprint(
                db,
                response['fingerprint'],
                survey_id
            )

            if existing:
                # Update existing record
                logger.debug(f"Updating existing response ID {existing.response_id}")
                existing.rating = response['rating']
            else:
                # Create new response (using model_dump instead of dict)
                logger.debug("Creating new response")
                new_response = SurveyResponse(
                    **SurveyResponseCreate(
                        survey_id=survey_id,
                        email=response['email'],
                        rating=response['rating'],
                        response_date=response['timestamp'],
                        fingerprint=response['fingerprint']
                    ).model_dump()
                )
                db.add(new_response)
        logger.info("Committing changes...")
        db.commit()
        logger.info("Update completed successfully")
    except Exception as e:
        db.rollback()
        logger.error("Commit failed", exc_info=True)
        raise

def response_exists(db: Session, fingerprint: str, survey_id: int) -> bool:
    """Check if a response with this fingerprint already exists"""
    return db.query(SurveyResponse).filter(
        SurveyResponse.fingerprint == fingerprint,
        SurveyResponse.survey_id == survey_id
    ).first() is not None

def get_response_by_fingerprint(db: Session, fingerprint: str, survey_id: int) -> Optional[SurveyResponse]:
    """Get existing response by fingerprint"""
    return db.query(SurveyResponse).filter(
        SurveyResponse.fingerprint == fingerprint,
        SurveyResponse.survey_id == survey_id
    ).first()
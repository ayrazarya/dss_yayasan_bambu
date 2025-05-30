from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List

from models import MarketSurvey, SurveyResponse

from schemas.market_surveys_schema import MarketSurveyCreate, MarketSurveyUpdate
from schemas.survey_responses_schema import SurveyResponseCreate, SurveyResponseUpdate
from utils.sheets_service import SheetService


# MarketSurvey Logic
def create_market_survey(db: Session, survey: MarketSurveyCreate) -> MarketSurvey:
    db_survey = MarketSurvey(**survey.model_dump())
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

def import_survey_responses_from_sheet(db: Session, spreadsheet_id: str, range_name: str) -> List[SurveyResponse]:
    sheet_service = SheetService()
    raw_data = sheet_service.get_sheet_data(spreadsheet_id, range_name) #spreadsheet_id should be market_surveys.form_response_id

    if not raw_data or len(raw_data) < 2:
        raise HTTPException(status_code=400, detail="No data found in the sheet")

    responses: List[SurveyResponse] = []
    for row in raw_data[1:]:  # skip header
        try:
            response_date_str = row[0] if len(row) > 0 else None
            email = row[1] if len(row) > 1 else None
            rating1_str = row[8] if len(row) > 8 else None
            rating2_str = row[10] if len(row) > 10 else None
            suggested_price = row[9] if len(row) > 9 else None

            # Parse date
            response_date = None
            if response_date_str:
                try:
                    response_date = datetime.fromisoformat(response_date_str)
                except ValueError:
                    response_date = None

            # Compute rating
            rating1 = float(rating1_str) if rating1_str else None
            rating2 = float(rating2_str) if rating2_str else None
            if rating1 is not None and rating2 is not None:
                rating = (rating1 + rating2) / 2
            else:
                rating = rating1 or rating2

            # Create SurveyResponse
            survey_response = SurveyResponse(
                survey_id=None,  # You can set this if needed
                email=email,
                rating=rating,
                suggested_price=suggested_price,
                response_date=response_date
            )
            db.add(survey_response)
            responses.append(survey_response)
        except Exception as e:
            print(f"Failed to process row {row}: {e}")

    db.commit()
    return responses
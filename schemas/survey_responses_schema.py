from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


class SurveyResponseBase(BaseModel):
    response_id: Optional[int] = None
    survey_id: int
    email: Optional[EmailStr] = None
    rating: Optional[float] = None
    response_date: Optional[datetime] = None
    fingerprint: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SurveyResponseCreate(SurveyResponseBase):
    response_id: None = None  # explicitly None during creation


class SurveyResponseUpdate(SurveyResponseBase):
    pass


class SurveyResponse(SurveyResponseBase):
    response_id: int  # explicitly include ID for reads
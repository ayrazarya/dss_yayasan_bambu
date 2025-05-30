from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class SurveyResponseBase(BaseModel):
    survey_id: int
    email: Optional[EmailStr]
    rating: Optional[float]
    suggested_price: Optional[str]  # Since it’s Text, treating it as string
    response_date: Optional[datetime]

class SurveyResponseCreate(SurveyResponseBase):
    pass

class SurveyResponseUpdate(SurveyResponseBase):
    pass

class SurveyResponseInDBBase(SurveyResponseBase):
    response_id: int

    class Config:
        orm_mode = True

class SurveyResponse(SurveyResponseInDBBase):
    pass
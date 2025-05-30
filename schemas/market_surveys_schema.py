from pydantic import BaseModel
from typing import Optional

class MarketSurveyBase(BaseModel):
    product_id: int
    form_response_id: Optional[str]  # Optional because it’s nullable (Text)

class MarketSurveyCreate(MarketSurveyBase):
    pass

class MarketSurveyUpdate(MarketSurveyBase):
    pass

class MarketSurveyInDBBase(MarketSurveyBase):
    survey_id: int

    class Config:
        orm_mode = True

class MarketSurvey(MarketSurveyInDBBase):
    pass
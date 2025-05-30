from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey, Double, TIMESTAMP
from sqlalchemy.orm import relationship

from utils.database import Base

class SurveyResponse(Base):
    __tablename__ = 'survey_responses'
    response_id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey('market_surveys.survey_id'))
    email = Column(String)
    rating = Column(Double)
    suggested_price = (Text)
    response_date = (TIMESTAMP)
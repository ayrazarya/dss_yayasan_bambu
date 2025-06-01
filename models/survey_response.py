from sqlalchemy import DateTime, Integer, String, Double, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from utils.database import Base

class SurveyResponse(Base):
    __tablename__ = 'survey_responses'
    
    response_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey('market_surveys.survey_id'))
    email: Mapped[str] = mapped_column(String)
    rating: Mapped[float] = mapped_column(Double)
    response_date: Mapped[DateTime] = mapped_column(TIMESTAMP)
    fingerprint: Mapped[str] = mapped_column(String(32))

    survey: Mapped['MarketSurvey'] = relationship("MarketSurvey", back_populates="responses")
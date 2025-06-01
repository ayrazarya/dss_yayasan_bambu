from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List

from utils.database import Base

class MarketSurvey(Base):
    __tablename__ = 'market_surveys'
    
    survey_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey('products.product_id'))
    form_response_id: Mapped[str] = mapped_column(Text)

    product: Mapped['Product'] = relationship('Product', back_populates='surveys')
    responses: Mapped[List['SurveyResponse']] = relationship('SurveyResponse', back_populates='survey')
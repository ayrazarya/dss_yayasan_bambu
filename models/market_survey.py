from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from utils.database import Base

class MarketSurvey(Base):
    __tablename__ = 'market_surveys'
    survey_id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.product_id'))
    respondent_id = Column(Integer, ForeignKey('users.user_id'))
    response_date = Column(DateTime)
    rating = Column(Integer)
    comments = Column(Text)

    product = relationship('Product', back_populates='surveys')
    respondent = relationship('User', back_populates='surveys')
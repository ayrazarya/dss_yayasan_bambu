from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship, Mapped
from typing import List

from utils.database import Base

class Product(Base):
    __tablename__ = 'products'
    product_id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(Text)
    development_cost = Column(Numeric)
    production_cost_per_unit = Column(Numeric)
    status = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    rankings = relationship('ProductRanking', back_populates='product')
    surveys: Mapped[List['MarketSurvey']] = relationship('MarketSurvey', back_populates='product')

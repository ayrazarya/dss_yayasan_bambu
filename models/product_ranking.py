
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from utils.database import Base



class ProductRanking(Base):
    __tablename__ = 'product_rankings'
    ranking_id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.product_id'))
    score = Column(Numeric)
    rank = Column(Integer)
    evaluated_at = Column(DateTime)

    product = relationship('Product', back_populates='rankings')
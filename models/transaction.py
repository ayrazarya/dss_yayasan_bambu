from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from utils.database import Base


class Transaction(Base):
    __tablename__ = 'transactions'
    transaction_id = Column(Integer, primary_key=True)
    marketed_product_id = Column(Integer, ForeignKey('marketed_products.marketed_product_id'))
    quantity = Column(Integer)
    total_amount = Column(Numeric)
    transaction_date = Column(DateTime)

    marketed_product = relationship('MarketedProduct', back_populates='transactions')

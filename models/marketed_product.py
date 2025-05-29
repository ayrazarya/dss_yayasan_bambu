from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from utils.database import Base


class MarketedProduct(Base):
    __tablename__ = 'marketed_products'
    marketed_product_id = Column(Integer, primary_key=True)
    source_product_id = Column(Integer, ForeignKey('products.product_id'))
    name = Column(String)
    launch_date = Column(Date)
    selling_price = Column(Numeric)
    is_active = Column(Boolean)

    product = relationship('Product', back_populates='marketed_products')
    transactions = relationship('Transaction', back_populates='marketed_product')



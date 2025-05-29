from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, ForeignKey
from utils.database import Base

class Admin(Base):
    __tablename__ = 'admins'
    admin_id = Column(Integer, primary_key=True , autoincrement=True)
    username = Column(String)
    password_hash = Column(String)
    email = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

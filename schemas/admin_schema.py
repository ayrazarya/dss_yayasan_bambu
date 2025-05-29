from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AdminBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True


class AdminCreate(AdminBase):
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminResponse(AdminBase):
    admin_id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

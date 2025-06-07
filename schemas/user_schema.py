from datetime import datetime
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Literal


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "decision_maker"
    is_active: Optional[bool] = True

    @validator("role")
    def validate_and_normalize_role(cls, v):
        if not v:
            return v
        normalized = v.strip().lower().replace(" ", "_")
        allowed = {"decision_maker", "evaluator"}
        if normalized not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return normalized


class UserCreate(UserBase):
    password: str



class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: EmailStr
    full_name: str | None
    role: str
    is_active: bool

    class Config:
        orm_mode = True



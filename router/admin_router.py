from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from controllers.admin_controller import get_admin_by_username, hash_password, login_admin
from schemas.admin_schema import AdminCreate, AdminLogin, AdminResponse, AdminLoginResponse
from models.admin import Admin
from utils.database import get_db
from dependencies.auth import get_current_admin  # JWT middleware

router = APIRouter()

@router.post("/register", response_model=AdminResponse)
def create_admin(admin_data: AdminCreate, db: Session = Depends(get_db)):
    existing_admin = get_admin_by_username(db, admin_data.username)
    if existing_admin:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = hash_password(admin_data.password)
    new_admin = Admin(
        username=admin_data.username,
        email=admin_data.email,
        full_name=admin_data.full_name,
        password_hash=hashed_password,
        is_active=admin_data.is_active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


@router.post("/login", response_model=AdminLoginResponse)
def login(admin_data: AdminLogin, db: Session = Depends(get_db)):
    return login_admin(db, admin_data)


@router.get("/", response_model=List[AdminResponse])
def get_all_admins(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)  # proteksi pakai token
):
    return db.query(Admin).all()

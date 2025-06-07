from sqlalchemy.orm import Session
from fastapi import HTTPException
from passlib.context import CryptContext
from models.admin import Admin
from schemas.admin_schema import AdminLogin
from utils.jwt_generate import create_access_token

# Inisialisasi context untuk hashing dan verifikasi password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Fungsi untuk membuat hash password
def hash_password(password: str):
    return pwd_context.hash(password)


# Fungsi untuk memverifikasi password
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


def get_admin_by_username(db: Session, username: str):
    return db.query(Admin).filter(Admin.username == username).first()


def login_admin(db: Session, admin_data: AdminLogin):
    admin = db.query(Admin).filter(Admin.username == admin_data.username).first()

    if not admin or not verify_password(admin_data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {"sub": admin.username, "admin_id": admin.admin_id}
    access_token = create_access_token(data=token_data)

    return {"access_token": access_token, "admin": admin}


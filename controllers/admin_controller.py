from sqlalchemy.orm import Session
from fastapi import HTTPException
from passlib.context import CryptContext
from models.admin import Admin
from schemas.admin_schema import AdminLogin

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

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verifikasi password menggunakan password_hash
    if not verify_password(admin_data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return admin

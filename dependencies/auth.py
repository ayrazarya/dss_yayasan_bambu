from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from utils.database import get_db
from models.user import User
from models.admin import Admin
from utils.config import SECRET_KEY, ALGORITHM  # ✅ Ambil dari config.py

# 2 skema berbeda
oauth2_scheme_user = OAuth2PasswordBearer(tokenUrl="/user/login")
oauth2_scheme_admin = OAuth2PasswordBearer(tokenUrl="/admin/login")


def get_current_user(token: str = Depends(oauth2_scheme_user), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (user)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(token: str = Depends(oauth2_scheme_admin), db: Session = Depends(get_db)) -> Admin:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        admin = db.query(Admin).filter(Admin.username == username).first()
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except JWTError as e:
        print("JWT Error:", e)  # Debug log
        raise HTTPException(status_code=401, detail="Token verification failed")

import os
from dotenv import load_dotenv

load_dotenv()  # Aktifkan .env

SECRET_KEY = os.getenv("JWT_SECRET", "changeme")  # Default untuk dev
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

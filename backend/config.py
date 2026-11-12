import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-enterprise-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-super-secret-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    
    # Database config
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = os.getenv("DB_PORT", "5434")
    DB_NAME = os.getenv("DB_NAME", "onboarding_db")
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Uploads config
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max limit per request
    ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
    
    # Encryption key for sensitive fields (AES-like or base64 token)
    DATA_ENCRYPTION_KEY = os.getenv("DATA_ENCRYPTION_KEY", "HR_ONBOARD_SECURE_TOKEN_2026")


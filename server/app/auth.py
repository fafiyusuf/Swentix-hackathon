from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.db import db
from app.utils import verify_password
from app.config import (
    SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ADMIN_COLLECTION,
)
from app.schemas import AdminLogin, Token


router = APIRouter(prefix="/auth", tags=["auth"])

# Bearer auth scheme
security_scheme = HTTPBearer(auto_error=True)


def create_access_token(subject: str, extra_claims: Optional[dict] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "role": "admin",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


@router.post("/login", response_model=Token)
def login(payload: AdminLogin):
    admins = db[ADMIN_COLLECTION]
    user = admins.find_one({"username": payload.username})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user.get("_id")))
    return Token(access_token=token, token_type="bearer", expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
):
    """Validate JWT and return admin document."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        admin_id = payload.get("sub")
        admins = db[ADMIN_COLLECTION]
        admin = admins.find_one({"_id": ObjectId(admin_id)})
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        admin = None

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin")
    return admin

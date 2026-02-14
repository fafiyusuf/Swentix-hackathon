from typing import Optional, List
from datetime import datetime # FIXED: Removed tomlkit
from pydantic import BaseModel, Field, EmailStr

class AdminLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class CandidateOut(BaseModel):
    id: str
    status: str
    first_name: str
    middle_name: Optional[str]
    last_name: str
    email: EmailStr
    phone_number: str
    cv_path: Optional[str] = None
    created_at: datetime

class Stats(BaseModel):
    total_requests: int
    approved: int
    rejected: int
    pending: int

class StatusUpdate(BaseModel):
    status: str
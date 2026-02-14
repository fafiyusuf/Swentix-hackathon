from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class AdminLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CandidateCreate(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: EmailStr
    phone_number: str
    national_id: Optional[str] = None
    fan_number: Optional[str] = None


class CandidateOut(BaseModel):
    id: str
    status: str
    candidate: Dict[str, Any]
    cv_path: Optional[str] = None


class CandidateDetail(CandidateOut):
    created_at: Optional[str] = None


class Stats(BaseModel):
    total_requests: int
    approved: int
    rejected: int
    pending: int


class GraphPoint(BaseModel):
    date: str
    total: int


class StatusUpdate(BaseModel):
    status: str

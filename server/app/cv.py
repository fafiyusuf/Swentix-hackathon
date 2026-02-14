import os
from uuid import uuid4
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

import app.db as db_module
from app.config import REQUESTS_COLLECTION, CV_FILES_DIR

router = APIRouter(prefix="/cv", tags=["cv"])


def _ensure_upload_dir():
    os.makedirs(CV_FILES_DIR, exist_ok=True)


@router.post("/submit")
async def submit_cv(
    first_name: str = Form(...),
    middle_name: str | None = Form(None),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: str = Form(...),
    national_id: str | None = Form(None),
    fan_number: str | None = Form(None),
    cv: UploadFile = File(...),
):
    """Submit a CV with candidate info. Stores file on disk and metadata in MongoDB.

    Frontend should send multipart/form-data with fields above.
    """
    # Basic content-type validation
    allowed_types = {"application/pdf"}
    if cv.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    _ensure_upload_dir()
    # Build a safe filename
    ext = os.path.splitext(cv.filename or "")[1].lower() or ".pdf"
    unique_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(CV_FILES_DIR, unique_name)

    # Save file
    try:
        with open(file_path, "wb") as f:
            while chunk := await cv.read(1024 * 1024):
                f.write(chunk)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save CV file")

    # Save metadata
    requests_col = db_module.db[REQUESTS_COLLECTION]
    doc = {
        "status": "pending",
        "candidate": {
            "first_name": first_name,
            "middle_name": middle_name,
            "last_name": last_name,
            "email": email,
            "phone_number": phone_number,
            "national_id": national_id,
            "fan_number": fan_number,
        },
        "cv_path": unique_name,  # store relative path
        "created_at": datetime.utcnow(),
    }

    res = requests_col.insert_one(doc)
    return {"id": str(res.inserted_id), "message": "CV submitted successfully"}

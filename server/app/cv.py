import os
import uuid
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

import app.db as db_module
from app.auth import get_current_admin
from app.config import REQUESTS_COLLECTION, CV_FILES_DIR
from app.schemas import Stats, StatusUpdate

router = APIRouter(prefix="/api/v1", tags=["Recruitment"])

def _serialize_doc(doc: dict) -> dict:
    """Helper to convert MongoDB _id to string 'id'."""
    if not doc: 
        return {}
    doc = dict(doc)
    _id = doc.get("_id")
    if isinstance(_id, ObjectId):
        doc["id"] = str(_id)
        doc.pop("_id", None)
    return doc

def _ensure_upload_dir():
    """Ensures the directory for storing CVs exists."""
    os.makedirs(CV_FILES_DIR, exist_ok=True)

# --- 1. SUBMISSION FORM (Public) ---
@router.post("/cv/submit")
async def submit_cv(
    first_name: str = Form(...),
    middle_name: str = Form(None),
    last_name: str = Form(...),
    email: str = Form(...),
    phone_number: str = Form(...),
    national_id: str = Form(None),
    fan_number: str = Form(None),
    cv_file: UploadFile = File(...)
):
    """
    Handles candidate CV submission. 
    Saves the file to disk and the metadata to MongoDB.
    """
    # Validate File Extension
    ext = os.path.splitext(cv_file.filename or "")[1].lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF or Word documents allowed")

    _ensure_upload_dir()
    
    # Create unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(CV_FILES_DIR, unique_name)

    # Save file using chunked reading for memory efficiency
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await cv_file.read(1024 * 1024): # 1MB chunks
                buffer.write(chunk)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to write file to disk")

    # Save to DB
    try:
        new_candidate = {
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
            "cv_path": unique_name,  # Store relative path for portability
            "created_at": datetime.now(timezone.utc)
        }
        res = db_module.db[REQUESTS_COLLECTION].insert_one(new_candidate)
    except Exception:
        # Cleanup: remove the file if DB insertion fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Database insertion failed")

    return {"message": "Application received successfully", "id": str(res.inserted_id)}

# --- 2. DASHBOARD STATS (Admin Only) ---
@router.get("/dashboard/stats", response_model=Stats)
async def get_stats(admin: dict = Depends(get_current_admin)):
    col = db_module.db[REQUESTS_COLLECTION]
    return {
        "total_requests": col.count_documents({}),
        "approved": col.count_documents({"status": "approved"}),
        "rejected": col.count_documents({"status": "rejected"}),
        "pending": col.count_documents({"status": "pending"})
    }

# --- 3. CANDIDATE MANAGEMENT (Admin Only) ---
@router.get("/candidates")
async def list_candidates(status: str = None, admin: dict = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    cursor = db_module.db[REQUESTS_COLLECTION].find(query).sort("created_at", -1)
    return [_serialize_doc(d) for d in cursor]

@router.patch("/candidates/{c_id}/status")
async def update_candidate_status(c_id: str, data: StatusUpdate, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(c_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    res = db_module.db[REQUESTS_COLLECTION].update_one(
        {"_id": obj_id},
        {"$set": {"status": data.status, "status_updated_at": datetime.now(timezone.utc)}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": f"Status updated to {data.status}"}

@router.get("/candidates/{c_id}/download")
async def download_cv(c_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(c_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    candidate = db_module.db[REQUESTS_COLLECTION].find_one({"_id": obj_id})
    if not candidate or "cv_path" not in candidate:
        raise HTTPException(status_code=404, detail="CV file not found in database")
    
    # Reconstruct the absolute path
    full_path = os.path.join(CV_FILES_DIR, candidate["cv_path"])
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Physical file missing from server storage")

    # Clean filename for the downloader
    last_name = candidate.get("candidate", {}).get("last_name", "download")
    return FileResponse(
        path=full_path,
        filename=f"CV_{last_name}.pdf",
        media_type="application/pdf"
    )
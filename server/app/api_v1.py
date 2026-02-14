import os
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

import app.db as db_module
from app.auth import get_current_admin
from app.config import REQUESTS_COLLECTION, CV_FILES_DIR
from app.schemas import Stats, StatusUpdate

router = APIRouter(prefix="/api/v1", tags=["Admin Dashboard"])

def _serialize_doc(doc: dict) -> dict:
    """Converts MongoDB BSON types (like ObjectId) to JSON-compatible strings."""
    if not doc:
        return {}
    doc = dict(doc)
    _id = doc.get("_id")
    if isinstance(_id, ObjectId):
        doc["id"] = str(_id)
        doc.pop("_id", None)
    return doc

# --- Dashboard Stats ---
@router.get("/dashboard/stats", response_model=Stats)
def get_dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    """Provides counts for the dashboard top-row cards."""
    requests_col = db_module.db[REQUESTS_COLLECTION]
    
    return Stats(
        total_requests=requests_col.count_documents({}),
        approved=requests_col.count_documents({"status": "approved"}),
        rejected=requests_col.count_documents({"status": "rejected"}),
        pending=requests_col.count_documents({"status": {"$in": ["pending", None]}})
    )

# --- Dashboard Graph Data ---
@router.get("/dashboard/graph")
def get_graph_data(current_admin: dict = Depends(get_current_admin)):
    """Returns time-series data for the dashboard chart (submissions per day)."""
    requests_col = db_module.db[REQUESTS_COLLECTION]
    
    pipeline = [
        {"$match": {"created_at": {"$exists": True}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "total": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    
    data = list(requests_col.aggregate(pipeline))
    return [{"date": d.get("_id"), "total": d.get("total", 0)} for d in data]

# --- Candidate Listing (Approved/Rejected/Pending Pages) ---
@router.get("/candidates")
def list_candidates(
    status: Optional[str] = Query(None, description="Filter by: approved, rejected, or pending"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin),
):
    """Returns a list of candidates. Used for the main table and filtered status pages."""
    requests_col = db_module.db[REQUESTS_COLLECTION]
    query = {}
    
    if status:
        if status not in {"approved", "rejected", "pending"}:
            raise HTTPException(status_code=400, detail="Invalid status filter")
        query["status"] = status
        
    cursor = requests_col.find(query).skip(skip).limit(limit).sort("created_at", -1)
    items = [_serialize_doc(doc) for doc in cursor]
    return {"items": items, "count": len(items)}

# --- Candidate Detail Pop-up ---
@router.get("/candidates/{candidate_id}")
def get_candidate_details(candidate_id: str, current_admin: dict = Depends(get_current_admin)):
    """Fetch full details for a specific candidate pop-up."""
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")
        
    doc = requests_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _serialize_doc(doc)

# --- Status Management (Approve/Reject Buttons) ---
@router.patch("/candidates/{candidate_id}/status")
def update_status(
    candidate_id: str,
    data: StatusUpdate,
    current_admin: dict = Depends(get_current_admin),
):
    """Updates a candidate's status and records the timestamp."""
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")

    update_fields = {
        "status": data.status,
        "status_updated_at": datetime.now(timezone.utc)
    }

    res = requests_col.update_one({"_id": obj_id}, {"$set": update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {"message": f"Candidate status successfully updated to {data.status}"}

# --- Secure CV Download ---
@router.get("/candidates/{candidate_id}/download")
def download_cv(candidate_id: str, current_admin: dict = Depends(get_current_admin)):
    """Verifies admin access and streams the PDF file from disk."""
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    doc = requests_col.find_one({"_id": obj_id})
    if not doc or "cv_path" not in doc:
        raise HTTPException(status_code=404, detail="CV file not found")

    # Construct path: handles both absolute and relative paths stored in DB
    file_path = doc["cv_path"]
    if not os.path.isabs(file_path):
        file_path = os.path.join(CV_FILES_DIR, file_path)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file missing from server storage")

    # Generate a clean filename for the hiring team
    last_name = doc.get("candidate", {}).get("last_name", "Candidate")
    friendly_name = f"CV_{last_name}.pdf"

    return FileResponse(
        path=file_path, 
        filename=friendly_name, 
        media_type="application/pdf"
    )
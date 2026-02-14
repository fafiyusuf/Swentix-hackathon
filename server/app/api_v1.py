import os
from datetime import datetime
from typing import Optional, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

import app.db as db_module
from app.auth import get_current_admin
from app.config import REQUESTS_COLLECTION, CV_FILES_DIR
from app.cv import router as cv_router
from app.schemas import Stats, StatusUpdate


router = APIRouter(prefix="/api/v1", tags=["api-v1"])

# Mount existing CV submission under /api/v1/cv/submit
router.include_router(cv_router, prefix="/cv")


def _serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    doc = dict(doc)
    _id = doc.get("_id")
    if isinstance(_id, ObjectId):
        doc["id"] = str(_id)
        doc.pop("_id", None)
    return doc


# Dashboard stats
@router.get("/dashboard/stats", response_model=Stats)
def dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    total = requests_col.count_documents({})
    approved = requests_col.count_documents({"status": "approved"})
    rejected = requests_col.count_documents({"status": "rejected"})
    pending = requests_col.count_documents({"status": {"$in": ["pending", None]}})
    return Stats(
        total_requests=total,
        approved=approved,
        rejected=rejected,
        pending=pending,
    )


# Dashboard graph — submissions per day
@router.get("/dashboard/graph")
def dashboard_graph(current_admin: dict = Depends(get_current_admin)):
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
    # Return as list of { date, total }
    return [{"date": d.get("_id"), "total": d.get("total", 0)} for d in data]


# Candidates listing
@router.get("/candidates")
def list_candidates(
    status: Optional[str] = Query(None, description="approved|rejected|pending"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin),
):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    query = {}
    if status:
        if status not in {"approved", "rejected", "pending"}:
            raise HTTPException(status_code=400, detail="Invalid status filter")
        query["status"] = status
    cursor = requests_col.find(query).skip(skip).limit(limit).sort("_id", -1)
    items: List[dict] = [_serialize_doc(doc) for doc in cursor]
    return {"items": items, "count": len(items)}


# Candidate detail
@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str, current_admin: dict = Depends(get_current_admin)):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Candidate not found")
    doc = requests_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _serialize_doc(doc)


# Update status
@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: str,
    data: StatusUpdate,
    current_admin: dict = Depends(get_current_admin),
):
    status = data.status
    if status not in {"approved", "rejected", "pending"}:
        raise HTTPException(status_code=400, detail="Invalid status value")

    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Candidate not found")

    update = {"$set": {"status": status, "status_updated_at": datetime.utcnow()}}
    if status == "approved":
        update["$set"]["approved_at"] = datetime.utcnow()
        update["$unset"] = {"rejected_at": ""}
    elif status == "rejected":
        update["$set"]["rejected_at"] = datetime.utcnow()
        update["$unset"] = {"approved_at": ""}
    else:
        # pending
        update["$unset"] = {"approved_at": "", "rejected_at": ""}

    res = requests_col.update_one({"_id": obj_id}, update)
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")

    doc = requests_col.find_one({"_id": obj_id})
    return _serialize_doc(doc)


# Download CV
@router.get("/candidates/{candidate_id}/download", response_class=FileResponse)
def download_candidate_cv(candidate_id: str, current_admin: dict = Depends(get_current_admin)):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(candidate_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Candidate not found")
    doc = requests_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cv_path = doc.get("cv_path")
    if not cv_path:
        raise HTTPException(status_code=404, detail="CV not available")

    if not os.path.isabs(cv_path):
        cv_path = os.path.join(CV_FILES_DIR, cv_path)

    if not os.path.exists(cv_path):
        raise HTTPException(status_code=404, detail="CV file missing")

    filename = os.path.basename(cv_path)
    return FileResponse(path=cv_path, media_type="application/pdf", filename=filename)

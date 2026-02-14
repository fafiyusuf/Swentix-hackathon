from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from bson import ObjectId
import os

from app.auth import router as auth_router, get_current_admin
from app.cv import router as cv_router
from app.api_v1 import router as api_v1_router
from app.config import REQUESTS_COLLECTION, CV_FILES_DIR
import app.db as db_module
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _check_mongo_connection():
    try:
        # Attempt a lightweight operation to verify connection
        db_module.db.list_collection_names()
        print("✅ MongoDB connected")
    except Exception as e:
        print("❌ MongoDB NOT connected:", e)


# Run check at import time so starting the app prints the connection status
_check_mongo_connection()


@app.get("/")
def root():
    return {"message": "✅ CV Verification API running"}


# Include auth routes
app.include_router(auth_router)
app.include_router(cv_router)
app.include_router(api_v1_router)


def _serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON serializable dict."""
    if not doc:
        return {}
    doc = dict(doc)
    _id = doc.get("_id")
    if isinstance(_id, ObjectId):
        doc["id"] = str(_id)
        del doc["_id"]
    return doc


@app.get("/admin/stats", tags=["admin"])
def admin_stats(current_admin: dict = Depends(get_current_admin)):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    total = requests_col.count_documents({})
    approved = requests_col.count_documents({"status": "approved"})
    rejected = requests_col.count_documents({"status": "rejected"})
    pending = requests_col.count_documents({"status": {"$in": ["pending", None]}})
    return {
        "total_requests": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
    }


@app.get("/admin/approved", tags=["admin"])
def approved_requests(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin),
):
    return list_requests(status="approved", limit=limit, skip=skip, current_admin=current_admin)


@app.get("/admin/rejected", tags=["admin"])
def rejected_requests(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin),
):
    return list_requests(status="rejected", limit=limit, skip=skip, current_admin=current_admin)


@app.get("/admin/pending", tags=["admin"])
def pending_requests(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin),
):
    return list_requests(status="pending", limit=limit, skip=skip, current_admin=current_admin)


@app.get("/admin/requests", tags=["admin"])
def list_requests(
    status: Optional[str] = Query(None, description="Filter by status: approved|rejected|pending"),
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


@app.get("/admin/requests/{request_id}", tags=["admin"])
def get_request(request_id: str, current_admin: dict = Depends(get_current_admin)):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")
    doc = requests_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    return _serialize_doc(doc)


@app.get("/admin/requests/{request_id}/cv", response_class=FileResponse, tags=["admin"])
def download_cv(request_id: str, current_admin: dict = Depends(get_current_admin)):
    requests_col = db_module.db[REQUESTS_COLLECTION]
    try:
        obj_id = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")
    doc = requests_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    cv_path = doc.get("cv_path")
    if not cv_path:
        raise HTTPException(status_code=404, detail="CV not available")

    # If stored as relative path, join with base dir
    if not os.path.isabs(cv_path):
        cv_path = os.path.join(CV_FILES_DIR, cv_path)

    if not os.path.exists(cv_path):
        raise HTTPException(status_code=404, detail="CV file missing")

    # Suggest a filename in Content-Disposition
    filename = os.path.basename(cv_path)
    return FileResponse(path=cv_path, media_type="application/pdf", filename=filename)



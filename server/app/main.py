from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.cv import router as cv_router
from app.api_v1 import router as api_v1_router
<<<<<<< HEAD
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
=======

app = FastAPI(title="CV Verification API")
>>>>>>> 4e6b63da6646b0d179b806f0b0272115b23c5045

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "✅ CV Verification API running"}

# These three lines include all the stats, download, and listing logic

app.include_router(auth_router)
app.include_router(cv_router)
app.include_router(api_v1_router)
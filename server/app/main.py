from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.cv import router as cv_router
from app.api_v1 import router as api_v1_router

app = FastAPI(title="CV Verification API")

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
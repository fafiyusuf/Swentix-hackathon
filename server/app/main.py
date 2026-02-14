from fastapi import FastAPI

app = FastAPI()

def root():
    return {"message": "✅ CV Verification API running"}



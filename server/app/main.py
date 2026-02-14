from fastapi import FastAPI
import app.db as db_module

app = FastAPI()


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



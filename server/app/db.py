from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "cv_verifier")

try:
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]

    # Simple test: list collections
    collections = db.list_collection_names()
    print(f"✅ Connected to MongoDB database '{MONGO_DB}'")
    print(f"Existing collections: {collections}")

except Exception as e:
    print("❌ Could not connect to MongoDB")
    print(e)

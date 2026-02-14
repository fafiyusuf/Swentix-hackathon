"""Database seeding utility.

Usage:
  python -m app.seed --username admin --password admin123

Environment fallbacks:
  ADMIN_USERNAME, ADMIN_PASSWORD (if CLI args not provided)

This creates an admin user if it doesn't exist, ensures helpful indexes,
and prepares the CV upload directory.
"""

import argparse
import os
from typing import Optional

from pymongo import ASCENDING

from app.db import db
from app.utils import hash_password
from app.config import ADMIN_COLLECTION, REQUESTS_COLLECTION, CV_FILES_DIR


def ensure_upload_dir() -> None:
    os.makedirs(CV_FILES_DIR, exist_ok=True)


def ensure_indexes() -> None:
    # Admins: unique username
    admins = db[ADMIN_COLLECTION]
    admins.create_index([("username", ASCENDING)], unique=True, name="uniq_username")

    # Requests: status and created_at for fast filtering and graphing
    requests = db[REQUESTS_COLLECTION]
    requests.create_index([("status", ASCENDING)], name="status_idx")
    requests.create_index([("created_at", ASCENDING)], name="created_at_idx")


def seed_admin(username: str, password: str) -> dict:
    admins = db[ADMIN_COLLECTION]
    existing = admins.find_one({"username": username})
    if existing:
        return {"status": "exists", "id": str(existing.get("_id"))}

    result = admins.insert_one({
        "username": username,
        "password_hash": hash_password(password),
    })
    return {"status": "created", "id": str(result.inserted_id)}


def main(argv: Optional[list[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="Seed admin user and DB indexes")
    parser.add_argument("--username", default=os.getenv("ADMIN_USERNAME"), help="Admin username")
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"), help="Admin password")

    args = parser.parse_args(argv)

    if not args.username or not args.password:
        raise SystemExit("Provide --username and --password or set ADMIN_USERNAME/ADMIN_PASSWORD env vars")

    ensure_upload_dir()
    ensure_indexes()
    res = seed_admin(args.username, args.password)
    print({
        "upload_dir": CV_FILES_DIR,
        "indexes": ["admins.uniq_username", "requests.status_idx", "requests.created_at_idx"],
        "admin": res,
    })


if __name__ == "__main__":
    main()

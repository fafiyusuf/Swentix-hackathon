import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# JWT settings
# Support both SECRET_KEY and legacy JWT_SECRET_KEY env var names
SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY", "super-secret-development-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Collections
ADMIN_COLLECTION = os.getenv("ADMIN_COLLECTION", "admins")
REQUESTS_COLLECTION = os.getenv("REQUESTS_COLLECTION", "requests")

# Optional base directory for CV files (used by download endpoint)
CV_FILES_DIR = os.getenv("CV_FILES_DIR", os.path.join("server", "data", "cv_files"))


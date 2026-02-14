CV Verification API — Admin Dashboard Backend

FastAPI + MongoDB backend for admin authentication and hiring team dashboard.

Environment
Create a `.env` file in `server/` (or project root) with:

MONGO_URI=mongodb://localhost:27017
MONGO_DB=cv_verifier
SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
# Optional: base directory for CV files used by download endpoint
CV_FILES_DIR=server/data/cv_files

Install dependencies (use the provided virtualenv `fastapi-env` or your own):

source server/fastapi-env/bin/activate
pip install -r server/requirements.txt

Run the API:

uvicorn app.main:app --reload --app-dir server

Collections

- `admins`: `{ _id, username, password_hash }`
- `requests`: `{ _id, status: 'approved'|'rejected'|'pending', candidate: { name, email, ... }, cv_path: 'relative/or/absolute.pdf', ... }`

Seed an admin user (recommended):

Use the built-in seeding utility to create an admin and ensure indexes:

```bash
# Option A: via CLI args
python -m app.seed --username admin --password admin123

# Option B: via env vars
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin123
python -m app.seed
```

This will:
- Create `admins` user if missing (unique on `username`)
- Ensure indexes on `requests.status` and `requests.created_at`
- Create the upload dir configured by `CV_FILES_DIR`

Endpoints

- `POST /auth/login` — Admin login
	- body: `{ "username": string, "password": string }`
	- returns: `{ access_token, token_type, expires_in }`

- `POST /cv/submit` — Public
  - multipart form-data: fields `first_name`, `middle_name?`, `last_name`, `email`, `phone_number`, `national_id?`, `fan_number?`, and file field `cv` (PDF)
  - returns: `{ id, message }`

- `GET /admin/stats` — Protected
	- totals of requests: approved, rejected, pending

- `GET /admin/requests?status=approved|rejected|pending&limit=50&skip=0` — Protected
	- list requests (paginated)

- `GET /admin/approved` — Protected
	- list approved requests (same result as `status=approved`)

- `GET /admin/rejected` — Protected
	- list rejected requests

- `GET /admin/pending` — Protected
	- list pending requests

- `GET /admin/requests/{id}` — Protected
	- details for a single request

- `GET /admin/requests/{id}/cv` — Protected
	- downloads the CV file stored in `cv_path`

Use `Authorization: Bearer <token>` header for protected endpoints.

Notes

- CV files: if `cv_path` is relative, it's joined with `CV_FILES_DIR`.
- Make sure the file exists and is accessible by the server process.
- Extend `requests` schema to match your frontend needs (skills, education, etc.).

API v1 (versioned) endpoints

- `POST /api/v1/cv/submit` — same as `/cv/submit` but under a versioned path
- `GET /api/v1/dashboard/stats` — totals for cards (total, approved, rejected, pending)
- `GET /api/v1/dashboard/graph` — submissions per day for charting
- `GET /api/v1/candidates?status=approved|rejected|pending&limit=50&skip=0` — list candidates
- `GET /api/v1/candidates/{id}` — candidate detail
- `PATCH /api/v1/candidates/{id}/status` — update status; body `{ "status": "approved|rejected|pending" }`
- `GET /api/v1/candidates/{id}/download` — download CV file

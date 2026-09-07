# OfferStackr — Smart Job Application Management System

Full-stack personal job-search management platform built with React, FastAPI, SQLAlchemy and SQLite.

## Included features

- JWT authentication and protected routes
- Application CRUD
- Search, filtering and priority
- Application Board pipeline
- Tags
- Interview and follow-up tracking
- Smart 7-day reminders
- Dashboard analytics
- Weekly application goal and streak
- Application timeline/history
- Interview preparation hub
- Resume upload, replace, download and delete
- CSV import/export
- Responsive UI and dark/light theme

## Run locally

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\\Scripts\\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Copy `.env.example` to `.env` and set a strong `SECRET_KEY` before deployment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For local development, the default API URL is `http://127.0.0.1:8000`.
For another backend URL, create `.env` from `.env.example` and set `VITE_API_URL`.

## Production

The repository also includes Dockerfiles and `docker-compose.yml` for a simple containerized deployment.

> Do not commit real `.env` files, uploaded resumes, or personal database data to a public repository.

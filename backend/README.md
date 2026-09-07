# OfferStackr API

OfferStackr is a FastAPI-based backend application that helps users manage and track their job applications efficiently.

## Features

- User Signup
- User Login with JWT Authentication
- Dashboard Statistics
- Create Job Application
- View All Jobs
- Search Jobs by Company
- Filter Jobs by Status
- Filter Jobs by Applied Date
- Update Job Details
- Delete Job Applications
- Secure Protected Routes
- Pagination and Sorting

## Tech Stack

- FastAPI
- Python
- SQLAlchemy
- SQLite
- JWT Authentication
- Passlib (bcrypt)
- Pydantic
- Uvicorn

## Installation

```bash
git clone <repository-url>

cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## API Documentation

Swagger UI:

```
http://127.0.0.1:8000/docs
```

## Author

Lahari Maram
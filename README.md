# OfferStackr

A full-featured job application and career management SaaS platform designed to centralize job applications, interview pipelines, resume versions, weekly goals, and job-search analytics in one place.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-blue?style=flat-square)](https://offerstackr-frontend.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/Lahari-Maram/OfferStackr)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)

---

## Overview

Finding a job is a multi-step project with hundreds of moving pieces. Job seekers frequently face:

- **Fragmented Information:** Application details scattered across personal spreadsheets, email threads, bookmarked job portals, and desktop notes.
- **Untracked Interview Stages:** Missing critical follow-ups, coding assessment deadlines, and multi-round interview schedules.
- **Disorganized Resumes:** Confusion over which tailored resume version was submitted to which employer.
- **Lack of Visibility:** No consolidated insights into application velocity, response rates, or interview conversion trends.

**OfferStackr** solves these challenges by providing a dedicated, end-to-end career workspace. It brings structured pipeline management, multi-round interview tracking, online assessment logs, master and role-specific resume storage, smart reminder alerts, goal tracking, and visual analytics into a clean, modern web interface.

### Target Audience

- **Active Job Seekers & Professionals** managing high-volume job applications across multiple job boards and companies.
- **Software Engineers & Technical Candidates** needing structured tracking for coding assessments, technical screens, system design rounds, and behavioral interviews.
- **New Graduates & Career Changers** looking to stay organized, set weekly targets, maintain application streaks, and monitor conversion metrics.

---

## Key Features

Every feature listed below is fully implemented and operational in the current release:

### 💼 Application Pipeline Management
- **Interactive Kanban Board & List Views:** Move applications across pipeline stages (**Saved**, **Applied**, **Assessment**, **Interview**, **Offer**, **Rejected**, **Withdrawn**) or toggle to a searchable tabular view.
- **Comprehensive Opportunity Details:** Record company, job title, job URL, job portal, work mode (Remote, Hybrid, On-site), employment type (Full-time, Internship, Contract, Part-time), salary/compensation, location, and custom priority (High, Medium, Low).
- **Recruiter & Contact Tracking:** Store recruiter names, emails, LinkedIn profiles, phone numbers, and direct communication notes.
- **Custom Tags & Advanced Filtering:** Organize opportunities with custom tags, instant full-text search, and multi-parameter filters (status, priority, date range).
- **Application Event Timeline:** Automatically logs status transitions, note additions, and updates into an auditable activity history.

### 📅 Multi-Round Interview Tracking
- **Round-by-Round Scheduling:** Track multi-stage interview loops (e.g., HR Screen, Technical Round, System Design, Hiring Manager, Behavioral).
- **Interview Metadata:** Store date, time, interview type (Video, Phone, In-person), meeting links, interviewer names, and location.
- **Dedicated Preparation & Result Notes:** Dedicated workspaces to write preparation questions, company research, and post-interview debrief notes.
- **Status Management:** Mark rounds as Scheduled, Completed, or Cancelled.

### 🧪 Online Assessment Hub
- **Technical Test & Take-Home Tracking:** Log online assessments, coding challenges, aptitude tests, and take-home assignments.
- **Platform & URL Association:** Track testing platforms (HackerRank, LeetCode, CodeSignal, TestGorilla, Custom) and direct test access links.
- **Deadline & Completion Tracking:** Monitor scheduled dates, completion status, and test notes.

### 🔔 Smart Reminders & Notifications
- **Contextual Reminders:** Create time-sensitive reminders for upcoming interviews, pending assessments, and application follow-ups.
- **In-App Notification Center:** Consolidated notification feed for system events, milestone achievements, and upcoming deadlines.
- **Configurable Notification Offsets:** Set reminder triggers before key events (e.g., 24 hours or 1 hour prior).

### 📁 Resume Vault & Application Attachments
- **Master Resume Vault:** Upload, replace, preview, download, and delete a primary resume (PDF, DOCX up to 5MB).
- **Per-Application Resumes:** Attach specific resume versions directly to individual job applications to maintain a precise record of what was submitted.

### 📊 Dashboard & Visual Analytics
- **Pipeline Metrics Overview:** Real-time counters for Total Applications, Active Interviews, Pending Assessments, Offers Received, and Response Rates.
- **7-Day Activity Trend:** Interactive Recharts visualization tracking daily application volume and momentum.
- **Conversion Funnels & Status Distribution:** Breakdown of applications across every pipeline stage to analyze conversion from applied to interview to offer.
- **Monthly Volume Trends:** Track long-term submission velocity month over month.

### 🎯 Goals, Streaks & Gamified Achievements
- **Weekly Application Goals:** Set custom weekly application targets with dynamic visual progress bars.
- **Activity Streak Tracker:** Real-time streak counter to encourage consistent job-search momentum.
- **12 Milestone Achievements:** Earn gamified achievement badges for milestones (e.g., *First Step*, *Ten Down*, *Fifty Club*, *Century Club*, *First Interview*, *Triple Threat*, *Offer Secured*, *Streak Master*, *Resume Ready*).

### 📝 Career Hub & Workspace Notes
- **Categorized Career Notes:** Create and manage rich notes tagged by category (**General**, **Interview Prep**, **Company Research**, **Questions**, **Technical**, **HR**).
- **Searchable Knowledge Base:** Quickly reference past answers, behavioral STAR stories, and company talking points.

### 🔄 Data Portability (Import / Export)
- **One-Click CSV Export:** Export complete application records with all metadata for backup and offline analysis.
- **CSV Import Engine:** Bulk import job applications from existing spreadsheets with automatic column mapping.

### 🔐 Authentication & Profile Management
- **Secure Authentication:** User registration, OAuth2 password login, and stateless JWT token authorization with protected routes.
- **OTP Password Reset:** Forgot-password flow supporting 6-digit one-time password (OTP) delivery and verification via email.
- **Profile Photo & Avatar System:** Upload, replace, and delete custom profile avatars (JPEG/PNG up to 2MB) with an automatic branded SVG fallback avatar.
- **Profile Customization:** Update full name, email address, and weekly goal targets.

### 🎨 Modern UI / UX
- **Responsive SaaS Interface:** Built for desktop, tablet, and mobile screens with a collapsible sidebar and clean typography.
- **Dual Theme Support:** Seamless toggle between **Light Theme** and sleek **Dark Theme**.
- **Accessible Feedback:** Non-intrusive toast alerts for actions, form validations, and asynchronous operations.

---

## Product Workflow

OfferStackr streamlines the job search into a continuous, structured workflow:

```text
1. Set Up Profile & Goals
   └── Create an account, configure profile photo, and set a weekly application target.
          │
2. Capture New Opportunities
   └── Add job details, salary range, recruiter info, tags, and attach a specific resume.
          │
3. Track Across the Kanban Pipeline
   └── Move cards from Saved → Applied → Assessment → Interview → Offer.
          │
4. Schedule & Prepare for Interviews & Assessments
   └── Log multi-round technical/behavioral stages, record test platforms, and save prep notes.
          │
5. Set Smart Follow-ups & Career Notes
   └── Schedule reminder alerts and capture company research in the Career Notes workspace.
          │
6. Monitor Velocity & Celebrate Milestones
   └── Review 7-day activity charts, conversion funnels, maintain daily streaks, and unlock badges.
          │
7. Backup & Port Data
   └── Export your complete portfolio to CSV or import past records anytime.
```

---

## Product Areas

| Area | Route | Purpose |
| --- | --- | --- |
| **Dashboard** | `/dashboard` | Executive summary of active applications, weekly goal progress, 7-day activity chart, and pipeline metrics |
| **Applications / Board** | `/jobs` | Interactive Kanban pipeline and tabular list view with search, filtering, and priority tagging |
| **Add Application** | `/add-job` | Comprehensive form to log company details, compensation, recruiter info, work mode, and resume attachments |
| **Interviews** | `/interviews` | Multi-round interview manager with schedules, interviewer contact info, and preparation notes |
| **Assessments** | `/assessments` | Online coding test and take-home challenge tracker with platform and completion status |
| **Reminders** | `/reminders` | Centralized notification list and time-sensitive alerts for interviews, tests, and follow-ups |
| **Analytics & Reports** | `/analytics`, `/reports` | Visual conversion funnels, status distributions, response rates, and monthly volume trends |
| **Goals & Streaks** | `/goals` | Weekly application target management, active streak monitoring, and submission history |
| **Achievements** | `/achievements` | 12 unlockable milestone badges celebrating job-search consistency and career progress |
| **Resume Vault** | `/resume-vault` | Central repository for master resume upload, download, replacement, and application attachments |
| **Career Hub & Notes** | `/career-hub`, `/notes` | Categorized knowledge base for interview questions, technical notes, and company research |
| **Timeline** | `/timeline` | Chronological audit trail of all application events, status transitions, and submissions |
| **Profile & Settings** | `/profile`, `/settings` | User account settings, weekly goal configuration, password updates, and profile photo management |

---

## Tech Stack

| Layer | Technology | Details |
| --- | --- | --- |
| **Frontend Framework** | React 18 + Vite | Fast Single Page Application (SPA) architecture with React Router v7 |
| **UI & Styling** | Vanilla CSS + Lucide Icons | Modular design system with Dark/Light CSS variables and Lucide React icons |
| **Data Visualization** | Recharts | Responsive 7-day activity chart, conversion rate graphs, and status charts |
| **HTTP Client** | Axios | Configured with base URLs, interceptors, and Bearer token injection |
| **Notifications** | React Toastify | Smooth toast notifications for status updates and feedback |
| **Backend Framework** | FastAPI (Python 3.12) | Asynchronous, high-performance REST API with automatic OpenAPI / Swagger docs |
| **ORM & Database Layer** | SQLAlchemy 2.0 | Declarative relational schema with connection pooling |
| **Production Database** | PostgreSQL | Robust relational database for user, application, interview, and resume data |
| **Authentication & Security** | OAuth2 + JWT (python-jose) | Stateless JWT Bearer tokens with Bcrypt password hashing via Passlib |
| **Email & Notifications** | SMTP / Python Email Service | 6-digit OTP password reset delivery and reminder notifications |
| **File Handling** | Python Multipart / OS Path | Local filesystem storage for resumes (PDF/DOCX) and profile photos (JPEG/PNG) |
| **Containerization** | Docker & Docker Compose | Multi-stage Dockerfiles for backend service and Nginx frontend |
| **Testing** | Pytest | Automated backend API integration and unit test suite |
| **Version Control** | Git + GitHub | Branch-based version control and CI/CD ready repository |

---

## Architecture

OfferStackr follows a clean, decoupled client-server architecture with strict separation of concerns:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          React + Vite (SPA)                            │
│   ThemeContext  •  UserContext  •  React Router DOM  •  Axios Interceptors │
│   Recharts Visualizations  •  Lucide Icons  •  Responsive CSS Modules  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ HTTPS / REST API (JSON & Multipart)
                                    │ Authorization: Bearer <JWT_TOKEN>
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            FastAPI Backend                             │
│   OAuth2 / JWT Authentication  •  Pydantic Schemas  •  CORS Middleware │
│   User-Scoped CRUD Services  •  SMTP Email Service  •  File Handlers   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ SQLAlchemy 2.0 ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL Database                           │
│   users • jobs • interviews • assessments • reminders • user_notes     │
│   resumes • application_resumes • user_goals • achievements • events   │
└────────────────────────────────────────────────────────────────────────┘
```

### Architectural Responsibilities

- **Frontend (Client Layer):** Single Page Application built with React and Vite. Manages UI state, theme switching (Dark/Light), user session context, interactive Kanban drag/drop status updates, and Recharts analytics.
- **Backend (API Layer):** FastAPI service providing RESTful endpoints. Enforces input validation using Pydantic schemas, handles multipart file uploads for resumes and avatars, executes email dispatch, and coordinates database operations.
- **Authentication & User Isolation:** Stateless JWT authentication ensures that every request is cryptographically verified. All database queries are strictly scoped to the authenticated `user_id`, preventing cross-user data access.
- **Database (Persistence Layer):** PostgreSQL relational database with foreign-key constraints and cascading deletes to maintain data integrity across applications, interviews, assessments, notes, and resumes.

---

## Project Structure

```text
OfferStackr/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py             # Database engine & session management
│   │   ├── email_service.py        # SMTP email & OTP delivery service
│   │   ├── main.py                 # FastAPI application routes & logic
│   │   ├── models.py               # SQLAlchemy ORM models
│   │   ├── schemas.py              # Pydantic request & response schemas
│   │   └── security.py             # Password hashing & JWT token handling
│   ├── tests/
│   │   └── test_api.py             # Pytest API integration test suite
│   ├── uploads/                    # Local storage for resumes and avatars
│   ├── Dockerfile                  # Production Dockerfile for backend
│   ├── requirements.txt            # Python backend dependencies
│   └── .env.example                # Backend environment template
├── frontend/
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── api/                    # Axios client configuration
│   │   ├── components/             # Reusable UI components & navigation
│   │   ├── context/                # ThemeContext & UserContext providers
│   │   ├── pages/                  # Top-level route pages (Dashboard, Jobs, etc.)
│   │   ├── styles/                 # Modular Vanilla CSS stylesheets
│   │   ├── App.jsx                 # Route definitions & app layout
│   │   └── main.jsx                # React root entrypoint
│   ├── Dockerfile                  # Multi-stage Dockerfile for Nginx frontend
│   ├── nginx.conf                  # Nginx reverse proxy configuration
│   ├── package.json                # Frontend dependencies & scripts
│   ├── vite.config.js              # Vite build configuration
│   └── .env.example                # Frontend environment template
├── docker-compose.yml              # Multi-container orchestration
└── README.md                       # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Python:** Version 3.10 or higher
- **Node.js:** Version 18.x or higher (with `npm`)
- **PostgreSQL:** Version 14 or higher (or SQLite for quick local evaluation)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/Lahari-Maram/OfferStackr.git
cd OfferStackr
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a Python virtual environment
python -m venv venv

# Windows (Command Prompt / PowerShell):
venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
ENVIRONMENT=development
SECRET_KEY=generate-a-secure-random-secret-key-32-chars-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=postgresql://postgres:password@localhost:5432/offerstackr_db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional: SMTP email configuration for real password-reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=true
EMAILS_FROM=OfferStackr <your-email@gmail.com>
```

> **Note:** If SMTP credentials are left blank in development, OTP reset codes are safely logged directly to the backend terminal.

Start the backend development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. Interactive API documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

In `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the Vite development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

### 4. Docker Deployment (Alternative)

To build and run both the frontend and backend with a single command using Docker:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8000`

---

## Testing

### Backend Test Suite

OfferStackr includes an automated API test suite covering user authentication, CRUD operations, metrics calculation, and file upload endpoints:

```bash
cd backend
pytest
```

### Frontend Build Verification

To verify that the frontend compiles cleanly with zero syntax or bundling errors:

```bash
cd frontend
npm run build
npm run lint
```

---

## Deployment

The application is configured for production hosting:

- **Frontend:** Hosted on [Render](https://render.com) as a Static Site / Web Service linked to the Vite production bundle.
- **Backend:** Hosted on [Render](https://render.com) as a Python Web Service running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Database:** Managed PostgreSQL instance on Render.
- **CORS:** Configured via `ALLOWED_ORIGINS` in the backend environment to securely restrict API access to the production frontend domain.

---

## Demo

- **Live Application:** [https://offerstackr-frontend.onrender.com](https://offerstackr-frontend.onrender.com)
- **GitHub Repository:** [https://github.com/Lahari-Maram/OfferStackr](https://github.com/Lahari-Maram/OfferStackr)
- **API Documentation:** `https://<backend-url>/docs` (Interactive Swagger UI)

---

## Engineering Practices

The OfferStackr codebase adheres to modern software engineering standards:

- **Stateless Authentication:** Secure JWT access tokens signed with HMAC-SHA256 and configurable token expiration.
- **Password Security:** Cryptographic password hashing using `bcrypt` with unique salt generation.
- **Strict User Data Isolation:** Every database operation enforces tenant isolation by querying strictly against the authenticated user's ID.
- **Input Validation & Type Safety:** Comprehensive Pydantic models validate incoming request payloads and format outgoing responses.
- **File Validation & Safety:** File upload endpoints enforce allowed MIME types (PDF, DOCX, PNG, JPEG), file size limits (2MB–5MB), and generate sanitized unique filenames to prevent path traversal attacks.
- **Clean RESTful API Design:** Standard HTTP response codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `422 Unprocessable Entity`).
- **Separation of Concerns:** Modular directory structure cleanly separating routes, business logic, data models, and schemas.
- **Automated Verification:** Continuous testing with Pytest and strict Vite production builds.

---

## Current Status

OfferStackr is currently in **v2.0 Production Release**, delivering a robust, full-stack application and career management platform with complete Kanban pipelines, multi-round interview logs, online assessment tracking, master resume vault, CSV import/export, weekly goals, and visual analytics.

---

## Future Enhancements

> **Note:** The following capabilities are planned directions for OfferStackr and are not currently part of the implemented product unless explicitly stated above.

### 🤖 AI Career Agent

A future AI agent designed to assist users throughout the job-search and career preparation lifecycle:

#### AI Resume Builder
- Build structured, professional resumes from user profile data, education, skills, projects, and work experience.
- Generate and manage multiple resume versions tailored to different job specializations.
- Maintain reusable bullet points with measurable impact metrics.

#### Resume Tailoring Agent
- Ingest and parse target job descriptions to extract essential technical and behavioral requirements.
- Compare job requirements against the candidate's active resume.
- Identify missing keywords, skill gaps, and suggest truthful phrasing improvements.
- Generate role-specific resume drafts without inventing fabricated experience.

#### Job Description Analyzer
- Automatically parse job descriptions into structured categories: core responsibilities, required qualifications, preferred skills, and tech stacks.
- Highlight key evaluation criteria and map them directly against the candidate's existing experience.

#### Resume-to-Job Matching & Fit Score
- Calculate semantic match scores between a resume version and a job posting.
- Provide actionable recommendations on which resume sections to strengthen prior to applying.

#### Cover Letter Assistant
- Generate concise, highly tailored cover letters referencing genuine user achievements and aligning with company mission statements.
- Allow candidates to review, tweak, and approve generated drafts.

---

### 🎯 AI Interview Preparation Agent

Intelligent interview coaching capabilities integrated directly into application workflows:

- **Custom Preparation Plans:** Generate structured study schedules based on specific job descriptions and candidate timelines.
- **Role-Specific Technical Questions:** Curate targeted coding, data structures, and algorithms (DSA) problem sets matching company question patterns.
- **Architecture & System Design Prompts:** Generate relevant system design and backend architecture challenges for senior engineering roles.
- **Behavioral & STAR Coaching:** Formulate role-relevant behavioral questions and help candidates structure responses using the Situation, Task, Action, Result (STAR) framework.
- **Application-Specific Prep History:** Store customized interview questions, practice answers, and feedback notes directly under each job application.

---

### 📬 Automated Application Capture

Automated capture to streamline job tracking without manual data entry:

- **Email Integration & Detection:** Detect application confirmation emails from supported email providers.
- **Intelligent Information Extraction:** Extract company name, job title, submission date, and application portal links.
- **Status Update Detection:** Automatically recognize interview invites, assessment links, offer letters, or status changes from follow-up emails.
- **Pipeline Synchronization:** Propose updates to the user's OfferStackr pipeline with a user-in-the-loop confirmation model.
- *(Note: Designed exclusively for automated application **tracking/capture**, not automated job application submission).*

---

### 🔍 Intelligent Job Search & Career Intelligence

- **Personalized Career Roadmap:** Tailored learning paths and skill-building recommendations based on target roles.
- **Long-Term Career Analytics:** Multi-month trend tracking across application cycles, salary negotiations, and skill acquisition.
- **Connected Career Workspace:** A unified workflow linking:
  ```text
  Job Description → Resume Version → Skill Gap → Prep Plan → Interview Notes → Outcome
  ```

---

## Roadmap

```text
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│        CURRENT         │     │          NEXT          │     │         LATER          │     │         FUTURE         │
├────────────────────────┤     ├────────────────────────┤     ├────────────────────────┤     ├────────────────────────┤
│ • Full Kanban Pipeline │ ──► │ • Job Description      │ ──► │ • Role-Specific DSA &  │ ──► │ • Automated Email App  │
│ • Multi-Round Interv.  │     │   Analyzer             │     │   System Design Prep   │     │   Capture & Tracking   │
│ • Assessment Hub       │     │ • Resume Tailoring     │     │ • Behavioral & STAR    │     │ • Personalized Career  │
│ • Resume Vault         │     │   Engine               │     │   Coaching Assistant   │     │   Intelligence Roadmap │
│ • Goals, Streaks & Badges│   │ • Skill Gap Analytics  │     │ • Application-Specific │     │ • Unified Career       │
│ • Visual Analytics     │     │ • Cover Letter Gen.    │     │   Preparation Plans    │     │   Workflow Graph       │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘     └────────────────────────┘
```

---

## Contributing

Contributions to OfferStackr are welcome. To contribute:

1. Fork the repository (`https://github.com/Lahari-Maram/OfferStackr/fork`).
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## Author

**Lahari Maram**

- **LinkedIn:** [https://www.linkedin.com/in/lahari-maram-17bba4265/](https://www.linkedin.com/in/lahari-maram-17bba4265/)
- **GitHub:** [https://github.com/Lahari-Maram](https://github.com/Lahari-Maram)
- **Project Repository:** [https://github.com/Lahari-Maram/OfferStackr](https://github.com/Lahari-Maram/OfferStackr)

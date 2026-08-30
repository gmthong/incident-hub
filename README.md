# 🚨 IncidentHub 

IncidentHub is a full-stack internal workspace for reporting production incidents, assigning incidents to engineers for fixing, and recording post-incident analyses.

## Demo Video

To be added...

## My Journey from Idea to Completion

IncidentHub took me roughly 6 weeks to build, and it is my first independently developed full-stack personal project.

The project began while I was taking a comprehensive FastAPI backend course to strengthen the backend skills relevant to my internship. Rather than simply following the course project, I decided from the beginning to apply what I learned to my own system, adapting and extending the concepts into something more practical and personally meaningful.

The idea for IncidentHub was inspired by a process I observed during my internship, where issues and enquiries were handled through internal tickets. I took that concept in a more technical direction: a workspace for reporting production incidents, assigning engineers to investigate them, tracking their resolution, and documenting post-incident analyses.

After completing the backend, I moved to the frontend and "teamworked" with Codex to build the ReactJS interface, which I already had experience with.

Overall, it was a fun journey. If I continue working on this project, I will mainly focus on implementing systematic tests, refactoring and reorganising code, and extending features.

## Tech Stack

- **Frontend**: ReactJS (Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, and Sonner)
- **Backend**: FastAPI (SQLModel, Redis, Celery, and Alembic)
- **Database**: PostgreSQL
- **Deployment**: Docker

## Features

- Account registration, email verification, login, logout, and password reset
- In-memory access tokens with HttpOnly refresh-cookie sessions
- Engineer, leader, and admin authorization
- Incident reporting, status updates, category replacement, assignment, and deletion
- Server-side incident and user pagination with a maximum page size of 50
- Severity-based incident analyses with author/admin modification rules
- Admin category, user, and global-analysis pages
- Responsive mobile, tablet, and desktop layouts
- Background email notifications for new incidents and incident assignments
- Migration-first Docker startup for the complete stack

## Database Design / ERD

```mermaid
erDiagram
    USERS_ACCOUNTS ||--o{ INCIDENTS : reports
    USERS_ACCOUNTS o|--o{ INCIDENTS : assigned_to
    USERS_ACCOUNTS ||--o{ INCIDENT_ANALYSES : authors
    INCIDENTS ||--o{ INCIDENT_ANALYSES : contains
    INCIDENTS ||--o{ INCIDENT_CATEGORY_ASSOCIATION : categorized_by
    INCIDENT_CATEGORIES ||--o{ INCIDENT_CATEGORY_ASSOCIATION : includes

    USERS_ACCOUNTS {
        uuid uid PK
        varchar_50 username UK
        varchar_50 first_name "nullable"
        varchar_50 last_name "nullable"
        user_role role "engineer, leader, admin"
        boolean is_verified
        varchar_100 email UK
        varchar_100 password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    INCIDENTS {
        uuid uid PK
        varchar_50 title
        varchar_50 affected_service
        varchar_50 environment
        timestamptz occurred_at
        incident_status status "OPEN, INVESTIGATING, RESOLVED"
        uuid reporter_uid FK
        uuid assigned_user_uid FK "nullable"
        timestamptz resolved_at "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    INCIDENT_ANALYSES {
        uuid uid PK
        analysis_severity severity "LOW, MEDIUM, HIGH, CRITICAL"
        text analysis_text "1-5000 characters"
        uuid user_uid FK
        uuid incident_uid FK
        timestamptz created_at
        timestamptz updated_at
    }

    INCIDENT_CATEGORIES {
        uuid uid PK
        varchar_50 name UK
        timestamptz created_at
    }

    INCIDENT_CATEGORY_ASSOCIATION {
        uuid incident_uid PK,FK
        uuid category_uid PK,FK
    }
```

**Relationship and deletion rules**:
- A user can report many incidents; every incident has exactly 1 reporter. Reporter deletion is restricted while their incidents exist.
- An incident has 0 or 1 assigned user; a user can be assigned many incidents. Deleting an assigned user sets the assignment to `NULL`.
- A user can author many analyses; every analysis has exactly 1 author. Author deletion is restricted while their analyses exist.
- An incident can contain many analyses. Deleting an incident cascades to its analyses.
- Incidents and categories have a many-to-many relationship through `incident_category_association`. Its two foreign keys form the composite primary key, and deleting either parent cascades to its association rows.

## Roles and Authorization Summary

| Capability | Engineer | Leader | Admin |
| --- | --- | --- | --- |
| View and report incidents | Yes | Yes | Yes |
| Update reported or assigned incidents | Yes | Yes | Yes |
| Update any incident | No | Yes | Yes |
| Assign incidents | No | Yes | Yes |
| Delete incidents | No | No | Yes |
| Create analyses | Yes | Yes | Yes |
| Edit/delete own analyses | Yes | Yes | Yes |
| Edit/delete any analysis | No | No | Yes |
| Manage categories and users | No | No | Yes |

Protected operations also require a verified account. The backend is always the authorization authority; frontend visibility is only a usability layer.

## Validation Constraints

**Accounts and authentication**:

- Username, first name, and last name must contain 1–50 characters.
- Email addresses must be valid, less than 100 characters, and unique.
- New and reset passwords must be 8–72 characters. They must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number.
- Password confirmation must exactly match the new password.
- Accounts must be email-verified before they can access protected incident, analysis, category, or administration operations.

**Incidents and assignment**:

- Incident title, affected service, and environment must contain 1–50 characters.
- `occurred_at` and `resolved_at` values must be valid, timezone-aware date-times.
- A new incident can start only as `OPEN` or `INVESTIGATING`.
- A resolution time cannot be earlier than the incident occurrence time. Resolving an incident sets `resolved_at`; moving it out of `RESOLVED` clears that value.
- Incident assignment accepts a valid email < 100 characters. The target must be verified and normally have the engineer role; leaders and admins may also assign themselves.

**Analyses, categories, and administration**:

- Analysis text must contain 1–5,000 characters.
- Category names must contain 1–50 characters.
- Admin updates user info, usernames and first/last names < 50 characters, and restrict roles to `engineer`, `leader`, or `admin`.
- Role checks and object ownership determine who can update or delete incidents and analyses, as summarized above.

## Requirements

For Docker development:

- Docker Desktop with Docker Compose

For local development:

- Python 3.11
- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL 17 and Redis 7, either locally or through Docker

## Run the complete stack with Docker

From the repository root:

```bash
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose ps
```

Before using a non-development deployment, remember to replace `JWT_SECRET_KEY` with your own long, random secret and configure valid SMTP credentials in `backend/.env`.

The services are available at:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Frontend health: `http://localhost:3000/health`
- API health: `http://localhost:8000/health`

The one-shot `migrate` service waits for PostgreSQL and runs `alembic upgrade head`. The API and worker start only after migration succeeds, and the frontend waits for the healthy API.

To stop:

```bash
docker compose down
```

`docker compose down` keeps the `incidenthub_postgres_data` and `incidenthub_redis_data` volumes. Do not add `-v` unless permanently deleting the new IncidentHub data is intentional.

## Run locally without application containers

You can use Docker only for PostgreSQL and Redis:

```bash
docker compose up -d db redis
```

### Backend

From `backend/`:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
cp .env.example .env
```

`requirements-dev.txt` includes `requirements.txt`, so developers running tests only install the development file. For runtime-only installation, install `requirements.txt` instead.

For local processes, set these values in `backend/.env`:

```dotenv
DATABASE_URL
REDIS_URL
FRONTEND_URL
CORS_ORIGINS
```

Then start each process from `backend/`:

```bash
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m uvicorn src.main:app --reload
.venv/bin/python -m celery -A src.celery_tasks.celery_app worker --loglevel=info
```

The API and worker commands run in separate terminals.

### Frontend

From `frontend/`:

```bash
cp .env.example .env
npm ci
npm run dev
```

## Quality Commands

Backend, from `backend/`:

```bash
.venv/bin/python -m pytest
.venv/bin/python -m alembic heads
```

Frontend, from `frontend/`:

```bash
npm run lint
npm test
npm run build
```

## Project Layout

```text
.
├── backend/
│   ├── docker/                 # API/worker container files
│   ├── migrations/             # Alembic revisions
│   ├── RestFox/                # Manual API examples
│   ├── src/                    # FastAPI application and domain modules
│   └── tests/                  # Backend endpoint tests
├── frontend/
│   ├── docker/                 # SPA build and Nginx runtime files
│   ├── src/
│   │   ├── app/                # Startup, providers, and routes
│   │   ├── auth/               # Session state, guards, and permissions
│   │   ├── components/         # Reusable UI and domain components
│   │   ├── config/             # Public environment and constants
│   │   ├── pages/              # Route-level screens
│   │   ├── services/           # API and React Query setup
│   │   ├── tests/              # Lightweight frontend tests
│   │   └── utils/              # Shared helpers
│   └── package.json
├── docker-compose.yml
├── frontend-design-plan.md
└── frontend-develop-plan.md
```

# User Registration App — Local Setup (Windows)

This repo contains a NestJS API and a React (Vite + TS) frontend, plus Dockerized PostgreSQL and pgAdmin.

## Project Overview

This is a complete User Registration System that includes:

- **Backend (NestJS)**: API for user registration with PostgreSQL database, input validation, password hashing, and comprehensive error handling
- **Frontend (React + Vite)**: Modern UI with form validation, user-friendly error messages, and responsive design
- **Database**: PostgreSQL with Docker containerization for easy setup
- **Login**: Frontend-only simulation (no backend authentication required per project specifications)

## Features

✅ **Backend API** (`/user/register` endpoint)

- User registration with email/password validation
- Secure password hashing with bcrypt
- Duplicate email prevention
- Comprehensive error handling and validation
- Database connectivity health checks

✅ **Frontend UI**

- Registration form with real-time validation
- Password strength indicator
- Login form simulation (UI only)
- Responsive design with Tailwind CSS
- Accessibility features (ARIA labels, keyboard navigation)
- Success/error feedback with visual indicators

✅ **Database**

- PostgreSQL with TypeORM integration
- Automatic schema creation in development
- Docker containerization for easy setup
- Optional pgAdmin web interface

✅ **Testing**

- Backend unit tests and e2e tests with Jest
- Comprehensive test coverage for validation and error scenarios

## Prerequisites

- Node.js 18+ and npm
- **Option 1 (Recommended):** Docker Desktop (for PostgreSQL + pgAdmin) - No local PostgreSQL installation needed
- **Option 2:** PostgreSQL installed locally + Docker Desktop (for pgAdmin only) - Requires local psql installation

**Note:** PostgreSQL client tools like `psql` are not required with Option 1 - all database operations use Docker commands

## 1) Start the database (PostgreSQL + pgAdmin)

### Option 1: Docker (Recommended)

```powershell
cd user-registration-api
# Start containers
docker-compose up -d

# Check containers
docker ps
```

- PostgreSQL: localhost:5432 (user: `postgres`, password: `password`, db: `user_registration`)
- pgAdmin: http://localhost:5050 (email: `admin@admin.com`, password: `admin`)

### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL locally:**

   - Download from: https://www.postgresql.org/download/windows/
   - During installation, set password to `password` for user `postgres`

2. **Create the database:**

   ```powershell
   # Connect to PostgreSQL and create database
   psql -U postgres -c "CREATE DATABASE user_registration;"
   ```

3. **Start pgAdmin (optional):**
   ```powershell
   cd user-registration-api
   # Start only pgAdmin container
   docker-compose up -d pgadmin
   ```
   - pgAdmin: http://localhost:5050 (email: `admin@admin.com`, password: `admin`)

**For pgAdmin connection (both options):**

Create a new Server:

- Name: User Registration DB (any)
- Connection
  - Host: `localhost` (or `postgres` for Docker option)
  - Port: `5432`
  - Username: `postgres`
  - Password: `password`

### (Optional) Create schema and seed sample data via SQL

We included SQL files to create the `users` table and seed a few example users.

#### Option 1: Using Docker (Recommended)

**Note:** These commands use Docker to execute SQL files inside the PostgreSQL container.

```powershell
cd user-registration-api

# Create schema (users table, unique index)
docker cp sql\01_create_schema.sql user-registration-db:/tmp/01_create_schema.sql
docker-compose exec postgres psql -U postgres -d user_registration -f /tmp/01_create_schema.sql

# Seed sample users (alice@example.com / Password123!, bob@example.com / Password123!)
docker cp sql\02_seed_sample_data.sql user-registration-db:/tmp/02_seed_sample_data.sql
docker-compose exec postgres psql -U postgres -d user_registration -f /tmp/02_seed_sample_data.sql
```

#### Option 2: Using Local psql

**Note:** Requires PostgreSQL installed locally with `psql` in PATH.

```powershell
cd user-registration-api

# Create schema (users table, unique index)
psql "postgresql://postgres:password@localhost:5432/user_registration" -f sql\01_create_schema.sql

# Seed sample users (alice@example.com / Password123!, bob@example.com / Password123!)
psql "postgresql://postgres:password@localhost:5432/user_registration" -f sql\02_seed_sample_data.sql
```

Notes:

- Scripts are idempotent (safe to run multiple times).
- Passwords are hashed server‑side using `crypt(..., gen_salt('bf'))` (bcrypt‑compatible).

## Sample Users

After seeding, these pre-registered users exist in the database for testing purposes:

- **alice@example.com** / **Password123!**
- **bob@example.com** / **Password123!**

**Note:** These users are for reference/testing registration only (e.g., testing duplicate email validation). **Login is simulated on the frontend** - no real authentication occurs. The login form will accept any valid email/password combination and simulate a successful login for UI demonstration purposes.

## 2) Run the backend (NestJS)

```powershell
cd user-registration-api
npm install
npm run start:dev
```

Backend runs at: http://localhost:3000

Note: If needed, set DB envs in `.env` (defaults in code match docker-compose):

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=user_registration
```

## 3) Run the frontend (React + Vite)

```powershell
cd user-registration-frontend
# (optional) create .env if not present
# echo VITE_API_URL=http://localhost:3000 > .env
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

The app expects the API base URL from `VITE_API_URL` (defaults to http://localhost:3000).

## API Endpoints

### POST /user/register

**Purpose**: Register a new user account
**Used by**: Frontend registration form
**Features**: Email validation, password hashing, duplicate prevention

### GET /health/db

**Purpose**: Database connectivity check
**Used by**: Health monitoring and troubleshooting

## How It Works

1. **Registration**: User fills out registration form → Frontend validates → Sends to `/user/register` → Backend validates, hashes password, saves to database → Returns success/error

2. **Login**: User fills out login form → Frontend simulates authentication → Shows success message → Redirects to dashboard (no actual backend authentication)

3. **Database**: PostgreSQL stores user data with secure password hashing

## Troubleshooting

- Ensure Docker Desktop is running before `docker-compose up -d`.
- If ports are in use, stop other services or change mappings in `docker-compose.yml` and Vite/Nest configs.
- If tables are missing, start the backend; TypeORM will create the `users` table in dev mode.

---

## Environment Variables Summary

API (`user-registration-api`):

- `NODE_ENV=production`
- `PORT` (provided by host, default 3000 locally)
- `DATABASE_URL` (preferred in production) or `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `FRONTEND_URL` (CORS allowed origin)
- or `FRONTEND_URLS` (comma‑separated origins)

Health check:

- `GET /health/db` returns database connectivity status (connected/disconnected)

Frontend (`user-registration-frontend`):

- `VITE_API_URL` (points to your API base URL)

---

## Tests (backend)

The backend (`user-registration-api`) includes unit tests and e2e tests using Jest.

Prerequisites:

- PostgreSQL running (use Option 1 or Option 2 from Step 1 above)
- A separate test database (the app doesn't create databases, only tables)

Create the test database once:

#### Option 1: Using Docker

```powershell
# Create user_registration_test database
cd user-registration-api
docker-compose exec postgres psql -U postgres -d postgres -c "CREATE DATABASE user_registration_test;"
```

#### Option 2: Using Local psql

```powershell
# Create user_registration_test database
psql "postgresql://postgres:password@localhost:5432/postgres" -c "CREATE DATABASE user_registration_test;"
```

Run unit tests:

```powershell
cd user-registration-api
npm run test
```

Run e2e tests:

```powershell
cd user-registration-api
npm run test:e2e
```

Notes:

- Tests set `NODE_ENV=test` automatically and use an isolated config that targets the `user_registration_test` database, with `synchronize: true` and `dropSchema: true` for a clean schema each run.
- If your Postgres credentials are different, set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE=user_registration_test` before running tests.

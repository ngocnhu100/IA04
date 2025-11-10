# user-registration-api

Minimal NestJS starter for user registration API with PostgreSQL database.

## Database Setup

### Prerequisites

- Node.js 18+ installed

### Option 1: Using Docker (Recommended)

If you have Docker installed, you can quickly spin up a PostgreSQL database:

```bash
# Start PostgreSQL database
docker-compose up -d postgres

# The database will be available at localhost:5432
# Credentials: postgres/password
```

### Option 2: Manual PostgreSQL Setup

Install PostgreSQL locally and create the database:

```bash
# On Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb user_registration
```

### Environment Variables

Copy `.env.example` to `.env` and update the database credentials:

```bash
cp .env.example .env
```

Default configuration (update as needed):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=user_registration
```

You can also use a single connection string in production (preferred):

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
# First deploy only (no migrations):
DB_SYNCHRONIZE=true
```

If your provider gives `postgresql://...`, change it to `postgres://...`.

### Install Dependencies & Run

```powershell
cd user-registration-api
npm install
npm run start:dev
# Server runs on http://localhost:3000/
```

**Note:** TypeORM will automatically create the `users` table when the application starts (in development mode).

## SQL scripts (schema + sample data)

Two helper scripts are available in `sql/`:

- `sql/01_create_schema.sql`: creates the `users` table and unique constraint (idempotent)
- `sql/02_seed_sample_data.sql`: inserts sample users with bcrypt‑compatible hashes

Run with `psql` (local Docker Postgres example):

```powershell
psql "postgresql://postgres:password@localhost:5432/user_registration" -f \
  ".\sql\01_create_schema.sql"
psql "postgresql://postgres:password@localhost:5432/user_registration" -f \
  ".\sql\02_seed_sample_data.sql"
```

## Database Schema

### User Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "IDX_USER_EMAIL" ON users (email);
```

## API Endpoints

### GET /health/db

Returns database connectivity status (connected/disconnected) with a timestamp.

### POST /user/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (201 Created):**

```json
{
  "id": "1234567890",
  "email": "user@example.com",
  "createdAt": "2025-11-03T08:48:45.163Z"
}
```

**Error Responses:**

**400 Bad Request - Validation Errors:**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "Email is required",
    "Please provide a valid email address (e.g., user@example.com)",
    "Password is required",
    "Password must be at least 8 characters long to ensure security"
  ],
  "timestamp": "2025-11-03T08:48:42.873Z"
}
```

**409 Conflict - Email Already Exists:**

```json
{
  "statusCode": 409,
  "error": "Email already registered",
  "message": "An account with this email address already exists. Please use a different email or try logging in instead.",
  "timestamp": "2025-11-03T08:48:46.186Z"
}
```

**500 Internal Server Error - System Errors:**

```json
{
  "statusCode": 500,
  "error": "Password processing failed",
  "message": "Unable to process your password. Please try again.",
  "timestamp": "2025-11-03T08:48:47.000Z"
}
```

## Validation Rules

- **Email**: Required, must be valid email format, normalized to lowercase
- **Password**: Required, 8-128 characters, hashed with bcrypt

## Testing

### Automated tests (Jest)

Prerequisites:

- PostgreSQL running (you can use the provided Docker Compose)
- A separate test database (the app creates tables, not databases)

Create the test database once:

```powershell
# Create user_registration_test database
psql "postgresql://postgres:password@localhost:5432/postgres" -c \
  "CREATE DATABASE user_registration_test;"
```

Run unit tests:

```powershell
cd user-registration-api
npm run test
```

Run e2e tests (ensure NODE_ENV=test so the test DB config is used):

```powershell
cd user-registration-api
$env:NODE_ENV = "test"
npm run test:e2e
# (optional) clear env when done: Remove-Item Env:NODE_ENV
```

Notes:

- In test mode, the app uses an isolated configuration targeting `user_registration_test` with `synchronize: true` and `dropSchema: true` to reset schema per run.
- If your Postgres credentials differ, set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE=user_registration_test` before running tests.

### Manual API checks (PowerShell)

**Note:** This API provides user registration functionality. Login is simulated on the frontend for UI demonstration purposes.

If you seeded sample data, the following users exist for testing registration (e.g., duplicate email validation):

- alice@example.com / Password123!
- bob@example.com / Password123!

Otherwise, register a user first, then test registration validation.

```powershell
# Test successful registration
Invoke-WebRequest -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"password123"}'

# Test validation errors
Invoke-WebRequest -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"email":"invalid","password":"short"}'

# Test duplicate email (using seeded alice@example.com)
Invoke-WebRequest -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"email":"alice@example.com","password":"different123"}'
```

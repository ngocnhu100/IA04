# user-registration-api

Minimal NestJS starter for user registration API with PostgreSQL database, JWT authentication, and role-based access control.

## 🚀 Public Deployment

The backend API is deployed and publicly accessible at: https://ia-04-backend-drab.vercel.app

**Note**: The hosted version includes an admin account seeded automatically. All API endpoints function correctly in the hosted environment.

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

**Note:** The hosted version at https://ia-04-backend-drab.vercel.app has `DB_SYNCHRONIZE=false` now that the schema is established, for production safety.

### Install Dependencies & Run

```powershell
cd user-registration-api
npm install
npm run start:dev
# Server runs on http://localhost:3000/
```

**Note:** TypeORM will automatically create the `users` table when the application starts (in development mode, or in production if `DB_SYNCHRONIZE=true`).

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
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "IDX_USER_EMAIL" ON public.users (email);
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

### POST /auth/login

Authenticate a user and return JWT tokens.

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
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/refresh

Refresh JWT access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (201 Created):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /user/profile (Protected)

Get the current user's profile information. Requires JWT authentication.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**

```json
{
  "id": "1234567890",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2025-11-03T08:48:45.163Z"
}
```

### GET /user/admin (Protected - Admin Only)

Access admin-only data. Requires JWT authentication and admin role.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**

```json
{
  "message": "This is admin-only data",
  "user": {
    "id": "1234567890",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2025-11-03T08:48:45.163Z"
  }
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

**Note:** This API provides user registration and authentication functionality with role-based access control. In production, an admin account is automatically seeded.

The following admin user exists for testing (created automatically in production):

- alice@example.com / Password123! (admin role)

Additional sample users for testing registration (if manually seeded):

- bob@example.com / Password123! (user role)

Register a user first, then test authentication and protected routes.

```powershell
# Test successful registration
Invoke-WebRequest -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"password123"}'

# Test login (get tokens)
$loginResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/login -Method POST -ContentType "application/json" -Body '{"email":"alice@example.com","password":"Password123!"}'
$tokens = $loginResponse.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken

# Test protected profile endpoint
Invoke-WebRequest -Uri http://localhost:3000/user/profile -Method GET -Headers @{Authorization="Bearer $accessToken"}

# Test admin-only endpoint (using admin token)
Invoke-WebRequest -Uri http://localhost:3000/user/admin -Method GET -Headers @{Authorization="Bearer $accessToken"}

# Test validation errors
Invoke-WebRequest -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"email":"invalid","password":"short"}'

# Test duplicate email (using seeded alice@example.com)
Invoke-WebRequest -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"email":"alice@example.com","password":"different123"}'
```

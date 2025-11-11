# User Registration Frontend

A minimal React + Vite + TypeScript frontend with JWT authentication that talks to the user registration API.

## 🚀 Public Deployment

The frontend is deployed and publicly accessible at: https://ia-04-frontend-sigma.vercel.app

**Note**: The hosted version connects to the backend API at https://ia-04-backend-drab.vercel.app. All protected routes and API calls function correctly in the hosted environment.

Quick start (PowerShell):

```powershell
cd user-registration-frontend
npm install
npm run dev
```

By default the app reads the backend base URL from `VITE_API_URL` in the environment (defaults to `http://localhost:3000` if not set). In production, it uses `https://ia-04-backend-drab.vercel.app`. Create a `.env` file or set the variable before starting the dev server.

Example .env (create `.env` file at project root):

```
VITE_API_URL=http://localhost:3000
```

The app provides registration and login forms that interact with the backend API for user authentication and profile management.

**Note:** The frontend implements full JWT-based authentication with protected routes. Users can register, login, access their profile, and admins can access admin-only content.

In production, an admin account is automatically available:

- alice@example.com / Password123! (admin role - can access admin dashboard)

Additional users can be registered through the frontend.

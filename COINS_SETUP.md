# Coins System Implementation - Setup Guide

## Overview

Implemented a complete coins system with backend database storage and Auth0 authentication.

## What Was Done

### Backend Changes

1. **Database Model** (`backend/app/models.py`)
   - Added `User` model with `auth0_sub`, `id`, and `coins` fields
2. **Auth0 Integration** (`backend/app/utils/auth0.py`)

   - JWT token verification using Auth0's JWKS
   - Automatic user creation on first login
   - Dependency injection for protected routes

3. **API Endpoints** (`backend/app/routers/users.py`)

   - `GET /users/me/coins` - Get current user's coins
   - `POST /users/me/coins/increment` - Add/subtract coins
   - `PUT /users/me/coins` - Set coins to specific value

4. **Database Migration**

   - Created and applied Alembic migration for users table

5. **Configuration**
   - Updated `.env` with Auth0 settings
   - Added CORS middleware for frontend access

### Frontend Changes

1. **Shop Page** (`frontend/src/Shop.tsx`)

   - Fetches coins from backend on load
   - Deducts coins through API on purchase
   - Shows real-time balance with affordability checks

2. **Run Page** (`frontend/src/Run.tsx`)

   - Saves earned coins to backend after each successful minigame

3. **API Client** (`frontend/src/lib/api.ts`)

   - Already existed with proper Auth0 token handling

4. **Auth0 Configuration** (`frontend/src/main.tsx`)

   - Added `audience` parameter to Auth0Provider

5. **Environment** (`frontend/.env`)
   - Added `VITE_AUTH0_AUDIENCE` for API authorization

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Database is already migrated, but if you need to reset:
# alembic downgrade base
# alembic upgrade head

# Start the server
python -m uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Auth0 Configuration (Already Done)

Your Auth0 is configured with:

- **Domain**: `dev-v0mmlcufmyjsq8l7.us.auth0.com`
- **Audience**: `https://api.skrawli`
- **Client ID**: `oO9Bl8mHNuo4W6tCMgDErHGfw2pSymZe`

**Important**: In your Auth0 Dashboard, make sure:

1. Go to Applications → APIs
2. Create an API with identifier `https://api.skrawli` (if not already exists)
3. Enable RBAC and Add Permissions in the Token
4. Go to your Application settings
5. In "Allowed Callback URLs", add: `http://localhost:5173`
6. In "Allowed Web Origins", add: `http://localhost:5173`

## How It Works

### User Flow

1. User logs in via Auth0
2. Backend automatically creates a user record with 0 coins (if new)
3. User plays minigames in Run mode and earns coins
4. Coins are saved to backend after each successful completion
5. User visits Shop and sees their real balance
6. Purchases deduct coins from backend
7. Balance syncs across all sessions and devices

### API Authentication

- Frontend gets Auth0 JWT token
- Token includes user's `sub` (subject) claim
- Backend verifies token signature via Auth0's JWKS
- Backend finds/creates user by `auth0_sub`
- All requests are authenticated and user-specific

## Testing

1. **Start both servers**
2. **Login** via the app
3. **Play Run mode** - earn coins by completing minigames
4. **Visit Shop** - see your balance and make purchases
5. **Logout and login again** - coins persist!

## API Endpoints

### Get Coins

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/users/me/coins
```

### Add Coins

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50}' \
  http://localhost:8000/users/me/coins/increment
```

### Set Coins

```bash
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"coins": 1000}' \
  http://localhost:8000/users/me/coins
```

## Notes

- Coins are stored per user in SQLite database (`backend/skrawli.db`)
- Owned items still use localStorage (can be migrated to backend later)
- Auth0 handles all authentication/authorization
- Backend validates every request with JWT verification
- CORS is configured for localhost:5173 and localhost:3000
- Legacy password/OAuth2 token flow removed (`auth.py`, `utils/security.py`, `schemas.py`) in favor of pure Auth0 RS256 JWT validation to reduce dead code.

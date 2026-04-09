# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Movie Nights is a full-stack web app for managing a movie watchlist and planning movie night events. It has a Python/FastAPI backend and a React/Vite frontend.

## Development Commands

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs available at `/docs`.

Environment variables (`.env` in `backend/`):
- `DATABASE_URL` — defaults to `sqlite:///./movie_nights.db`
- `SECRET_KEY` — JWT signing key, defaults to `dev-secret-key`
- `ALGORITHM` — JWT algorithm, defaults to `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` — defaults to `60`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. Vite proxies `/api/*` to `http://localhost:8000`, stripping the `/api` prefix before forwarding.

## Architecture

### Backend (`backend/`)

- `main.py` — FastAPI app entry point; defines all route handlers and Pydantic request/response schemas inline
- `models.py` — SQLAlchemy ORM models: `User`, `Movie`, `MovieNightEvent`, plus three many-to-many association tables (`user_liked_movies`, `event_movies`, `event_attendees`)
- `database.py` — SQLAlchemy engine/session setup; reads `DATABASE_URL` from env
- `auth.py` — JWT creation/decoding, bcrypt password hashing, and the `get_current_user` FastAPI dependency

Authentication uses OAuth2 password flow. The `/auth/login` endpoint accepts `application/x-www-form-urlencoded` (not JSON) because it uses `OAuth2PasswordRequestForm`.

Protected routes use `Depends(get_current_user)` injected as a parameter.

### Frontend (`frontend/src/`)

- `api/client.js` — single API client module; all fetch calls go through `request()`, which reads the JWT from `localStorage` and attaches it as a Bearer token
- `App.jsx` — router setup; `PrivateRoute` guards `/` by checking `localStorage` for a token
- `pages/` — `Login.jsx`, `Register.jsx`, `Dashboard.jsx`
- `components/` — shared UI components

The frontend communicates with the backend exclusively through the `api` object exported from `client.js`. Token storage and logout are handled there.

### Data Model

- `User` ↔ `Movie` (many-to-many via `user_liked_movies`, represents "likes")
- `MovieNightEvent` ↔ `Movie` (many-to-many via `event_movies`)
- `MovieNightEvent` ↔ `User` (many-to-many via `event_attendees`; separate from `organizer_id` FK)
- `User` → `MovieNightEvent` (one-to-many via `organizer_id`)

Note: `MovieNightEvent` is defined in the DB model but has no API routes yet in `main.py`.

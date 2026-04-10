# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Movie Nights is a full-stack web app for managing a personal movie watchlist and planning collaborative movie night events. It has a Python/FastAPI backend and a React/Vite frontend.

### Core Features

**Movie Browsing & Personal Lists**
- Users browse a shared movie catalog; each movie has a title, poster image, and IMDB link.
- Each user sets a personal preference per movie, choosing from:
  - `want_to_watch` → +2 (score)
  - `can_watch_if_needed` → +1
  - `already_watched` → 0
  - `dont_watch_without_me` → 0 + warning flag
  - `dont_want_to_watch` → −1 (veto)
- Users can browse their own filtered lists by preference on the My Lists page.
- Any logged-in user can add a movie to the global catalog. The primary flow is: paste an IMDB URL → auto-fill all fields via OMDB API. A "Add manually" fallback exists for movies without an IMDB page.
- Duplicate titles are rejected (case-insensitive) with a clear error message.
- The Browse page has a real-time search bar filtering by title, genre, or year.
- Movie cards open a detail modal showing poster, description, genre pills, IMDB link, preference selector, and similar movies by genre.

**Movie Night Events**
- A user creates an event with: name, date/time, and location.
- The organizer invites other users by username; invitees receive a pending invite and can accept or decline.
- Accepted users become attendees. The organizer is automatically an attendee on creation.
- Event detail has two tabs:
  - **Event Movies** — movies explicitly added to the event, ranked by collective attendee preference scores. Shows score badge and ⚠️ warning if anyone marked "don't watch without me". Organizer/attendees can remove movies.
  - **Group Picks** — shows the entire movie catalog with each attendee's preference. Current user's preference is an inline editable `<select>`; others show colour-coded pills. Filter buttons: All / No one objects / Someone wants it / Everyone wants it. Score badge and 🚫 veto flag shown. "+ Add" / "Remove" buttons to manage event movies inline.
- Users see all their events (upcoming + past, both organized and attending) on the Events page, with pending invites at the top (Accept/Decline).

---

## Agent Architecture

This project uses a multi-agent orchestration pattern. The **orchestrator** (the main Claude Code session) breaks work into tasks and delegates to specialized subagents.

### Agents

| Agent | Role |
|---|---|
| `orchestrator` | Plans work, creates tasks, delegates, integrates, reports to user |
| `backend-agent` | Implements Python/FastAPI/SQLAlchemy work: models, routes, schemas |
| `frontend-agent` | Implements React/Vite/JS work: pages, components, API client |

### Workflow Rules
1. Orchestrator creates tasks in the task system with clear descriptions and assigns them to agents.
2. Backend tasks must complete before dependent frontend tasks begin.
3. After each phase, smoke-test the backend routes directly before moving to frontend.
4. Orchestrator reports to the user every 15–30 minutes with a status update.

---

## Development — Starting the App

**Single command from the project root:**
```bash
python start.py
```
This kills any stale processes on ports 8000/5173, starts the backend in one terminal window and the frontend in another, and prints the URLs when ready. Falls back to port 8080 if 8000 is stuck.

**Manual start (if needed):**
```bash
# Terminal 1 — backend
cd backend
uvicorn main:app --port 8000 --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

**Seeding movies:**
```bash
cd backend
python -X utf8 seed_movies.py
```
Fetches ~250 movies from OMDB by IMDB ID (posters from Amazon CDN, plot descriptions included). Safe to re-run — duplicates are rejected by the API with 409. Uses the `testflow` / `pass123` account; create it first if needed. Requires the backend to be running.

Frontend runs at `http://localhost:5173`. Vite proxies `/api/*` → `http://localhost:8000` (stripping the `/api` prefix). Port configured in `frontend/vite.config.js`; `start.py` keeps this in sync automatically.

Backend API docs: `http://localhost:8000/docs`

### Environment variables (`.env` in `backend/`)
- `DATABASE_URL` — defaults to `sqlite:///./movie_nights.db`
- `SECRET_KEY` — JWT signing key, defaults to `dev-secret-key`
- `ALGORITHM` — JWT algorithm, defaults to `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` — defaults to `60`
- `OMDB_API_KEY` — OMDB API key for movie lookup and seeding, defaults to project key
- `FRONTEND_ORIGIN` — comma-separated allowed CORS origins, defaults to `http://localhost:5173,http://localhost:5174`

---

## Architecture

### Backend (`backend/`)

- `main.py` — FastAPI app; all route handlers and Pydantic schemas defined inline
- `models.py` — SQLAlchemy ORM models (see Data Model below)
- `database.py` — SQLAlchemy engine/session setup
- `auth.py` — JWT creation/decoding via `python-jose`, password hashing via `bcrypt` (direct, NOT passlib — passlib has a version conflict with bcrypt 4.x)
- `seed_movies.py` — standalone script to seed the movie catalog

Authentication uses OAuth2 password flow. `/auth/login` accepts `application/x-www-form-urlencoded` (not JSON) via `OAuth2PasswordRequestForm`. Protected routes use `Depends(get_current_user)`.

**DB schema note:** SQLAlchemy's `create_all` does not ALTER existing tables. If you add columns to a model, either delete `movie_nights.db` (dev) or run `ALTER TABLE` manually via SQLite.

### Backend API routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login (form-encoded) |
| GET | `/auth/me` | Yes | Current user |
| GET | `/movies` | No | All movies |
| GET | `/movies/lookup` | Yes | Fetch metadata from OMDB by `?imdb_url=` |
| POST | `/movies` | Yes | Add movie (rejects duplicate titles, case-insensitive) |
| PUT | `/movies/{id}/preference` | Yes | Set preference |
| DELETE | `/movies/{id}/preference` | Yes | Remove preference |
| GET | `/users/me/movies` | Yes | My movies (`?preference=` filter) |
| POST | `/events` | Yes | Create event |
| GET | `/events` | Yes | My events (organized + attending) |
| GET | `/events/{id}` | Yes | Event detail with ranked movies |
| POST | `/events/{id}/movies` | Yes | Add movie to event |
| DELETE | `/events/{id}/movies/{movie_id}` | Yes | Remove movie from event |
| GET | `/events/{id}/suggestions` | Yes | All movies with attendee preferences + scores |
| POST | `/events/{id}/invites` | Yes | Invite user (organizer only) |
| GET | `/users/me/invites` | Yes | Pending invites |
| POST | `/events/{id}/invites/respond` | Yes | Accept or decline invite |

### Frontend (`frontend/src/`)

- `api/client.js` — all API calls via `request()`; attaches Bearer token from `localStorage`; throws `Error` with `.status` property so callers can distinguish 401 from other errors
- `App.jsx` — router; `PrivateRoute` wraps all authenticated pages
- `pages/Login.jsx` — login form
- `pages/Register.jsx` — registration form
- `pages/Dashboard.jsx` — movie grid with real-time search (title/genre/year), 5-option preference selector per card, IMDB link, "+ Add Movie" button. Exports `Nav` and `PosterImage` components (shared across pages)
- `pages/MyLists.jsx` — movies filtered by preference tab
- `pages/Events.jsx` — upcoming/past events, pending invites with Accept/Decline, "+ Create Event"
- `pages/EventDetail.jsx` — event header, attendees, invite form (organizer only), two-tab view: Event Movies (ranked) + Group Picks (full catalog with editable preferences)
- `components/AddMovieModal.jsx` — two-step modal: (1) paste IMDB URL → auto-lookup via OMDB, (2) confirm/edit pre-filled form. "Add manually" fallback skips step 1.
- `components/MovieModal.jsx` — full detail modal: poster, description, genre pills, IMDB link, preference selector, similar movies by genre
- `components/CreateEventModal.jsx` — modal form to create an event

### Data Model

- `User` ↔ `Movie` — many-to-many via `user_movie_preferences` table (columns: `user_id`, `movie_id`, `preference` string). Queried directly via SQLAlchemy core, not ORM relationship.
- `MovieNightEvent` ↔ `Movie` — many-to-many via `event_movies`
- `MovieNightEvent` ↔ `User` — many-to-many via `event_attendees` (confirmed attendees)
- `EventInvitation` — ORM model with `event_id`, `user_id`, `status` (pending/accepted/declined). On accept: user is inserted into `event_attendees`.
- `User` → `MovieNightEvent` — one-to-many via `organizer_id`

**Movie fields:** `id`, `title`, `year`, `genre`, `poster_url`, `imdb_url`, `description`
**MovieNightEvent fields:** `id`, `name`, `scheduled_at`, `location`, `created_at`, `organizer_id`

### Preference scoring (used in both event ranking and suggestions)

| Preference | Score | Notes |
|---|---|---|
| `want_to_watch` | +2 | |
| `can_watch_if_needed` | +1 | |
| `already_watched` | 0 | |
| `dont_watch_without_me` | 0 | Sets `has_dont_watch_without_me` flag |
| `dont_want_to_watch` | −1 | Sets `has_veto` flag in suggestions |
| No preference | 0 | |

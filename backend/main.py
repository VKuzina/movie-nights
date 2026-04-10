from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List, Literal
from datetime import datetime
import logging
import re
import json
import urllib.request as _urllib_request
import models
from models import user_movie_preferences, event_attendees, event_movies
from database import engine, get_db
from auth import hash_password, verify_password, create_access_token, get_current_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Movie Nights API")
app.state.limiter = limiter

import os as _os
_allowed_origins = [o.strip() for o in _os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://localhost:5174").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# --- Schemas ---

class UserRegister(BaseModel):
    username: str = Field(min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_\-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class MovieCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    year: Optional[int] = Field(default=None, ge=1888, le=2100)
    genre: Optional[str] = Field(default=None, max_length=200)
    poster_url: Optional[str] = Field(default=None, max_length=2000)
    description: Optional[str] = Field(default=None, max_length=2000)
    imdb_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("poster_url", "imdb_url")
    @classmethod
    def must_be_http(cls, v):
        if v is not None and not v.lower().startswith(("http://", "https://")):
            raise ValueError("must be a valid http/https URL")
        return v

class MovieOut(BaseModel):
    id: int
    title: str
    year: Optional[int]
    genre: Optional[str]
    poster_url: Optional[str]
    description: Optional[str]
    imdb_url: Optional[str]
    model_config = {"from_attributes": True}

class PreferenceSet(BaseModel):
    preference: Literal[
        "want_to_watch",
        "can_watch_if_needed",
        "already_watched",
        "dont_watch_without_me",
        "dont_want_to_watch",
    ]

class MovieWithPreference(BaseModel):
    id: int
    title: str
    year: Optional[int]
    genre: Optional[str]
    poster_url: Optional[str]
    description: Optional[str]
    imdb_url: Optional[str]
    preference: Optional[str]
    model_config = {"from_attributes": True}

class EventCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    scheduled_at: datetime
    location: Optional[str] = Field(default=None, max_length=300)

class EventOut(BaseModel):
    id: int
    name: str
    scheduled_at: Optional[datetime]
    location: Optional[str]
    organizer: UserOut
    model_config = {"from_attributes": True}

class MovieScore(BaseModel):
    id: int
    title: str
    year: Optional[int]
    genre: Optional[str]
    poster_url: Optional[str]
    imdb_url: Optional[str]
    description: Optional[str]
    score: int
    has_dont_watch_without_me: bool

class EventDetail(BaseModel):
    id: int
    name: str
    scheduled_at: Optional[datetime]
    location: Optional[str]
    organizer: UserOut
    attendees: List[UserOut]
    movies: List[MovieScore]
    model_config = {"from_attributes": True}

class InviteCreate(BaseModel):
    username: str

class InviteRespond(BaseModel):
    status: Literal["accepted", "declined"]

class InviteOut(BaseModel):
    id: int
    event: EventOut
    status: str
    model_config = {"from_attributes": True}

class AddMovieToEvent(BaseModel):
    movie_id: int


VALID_PREFERENCES = {
    "want_to_watch",
    "can_watch_if_needed",
    "already_watched",
    "dont_watch_without_me",
    "dont_want_to_watch",
}

PREFERENCE_SCORES = {
    "want_to_watch": 2,
    "can_watch_if_needed": 1,
    "already_watched": 0,
    "dont_watch_without_me": 0,
    "dont_want_to_watch": -1,
}


# --- Auth routes ---

@app.post("/auth/register", response_model=UserOut, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Registration failed. Username or email already in use.")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Registration failed. Username or email already in use.")
    user = models.User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Movie routes ---

@app.get("/movies/lookup")
def lookup_movie(imdb_url: str, _: models.User = Depends(get_current_user)):
    """Fetch movie metadata from OMDB by IMDB URL."""
    match = re.search(r"(tt\d+)", imdb_url)
    if not match:
        raise HTTPException(status_code=400, detail="No IMDB ID found in URL. Expected format: https://www.imdb.com/title/tt1234567/")
    imdb_id = match.group(1)
    omdb_key = _os.getenv("OMDB_API_KEY", "8bed798d")
    try:
        with _urllib_request.urlopen(f"http://www.omdbapi.com/?i={imdb_id}&apikey={omdb_key}", timeout=8) as r:
            data = json.loads(r.read())
    except Exception:
        raise HTTPException(status_code=502, detail="Could not reach OMDB API")
    if data.get("Response") == "False":
        raise HTTPException(status_code=404, detail=f"Movie not found on OMDB: {data.get('Error', 'Unknown error')}")
    year = None
    try:
        year = int(str(data.get("Year", ""))[:4])
    except (ValueError, TypeError):
        pass
    poster = data.get("Poster")
    return {
        "title": data.get("Title"),
        "year": year,
        "genre": data.get("Genre") if data.get("Genre") != "N/A" else None,
        "poster_url": poster if poster and poster != "N/A" else None,
        "imdb_url": f"https://www.imdb.com/title/{imdb_id}/",
        "description": data.get("Plot") if data.get("Plot") != "N/A" else None,
    }


@app.get("/movies", response_model=List[MovieOut])
def list_movies(db: Session = Depends(get_db)):
    return db.query(models.Movie).all()


@app.post("/movies", response_model=MovieOut, status_code=201)
def add_movie(
    payload: MovieCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    existing = db.query(models.Movie).filter(
        func.lower(models.Movie.title) == func.lower(payload.title.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f'"{existing.title}" ({existing.year}) is already in the catalog.',
        )
    movie = models.Movie(**payload.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@app.put("/movies/{movie_id}/preference", status_code=204)
def set_preference(
    movie_id: int,
    payload: PreferenceSet,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    db.execute(
        user_movie_preferences.delete().where(
            user_movie_preferences.c.user_id == current_user.id,
            user_movie_preferences.c.movie_id == movie_id,
        )
    )
    db.execute(
        user_movie_preferences.insert().values(
            user_id=current_user.id,
            movie_id=movie_id,
            preference=payload.preference,
        )
    )
    db.commit()


@app.delete("/movies/{movie_id}/preference", status_code=204)
def delete_preference(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.execute(
        user_movie_preferences.delete().where(
            user_movie_preferences.c.user_id == current_user.id,
            user_movie_preferences.c.movie_id == movie_id,
        )
    )
    db.commit()


@app.get("/users/me/movies", response_model=List[MovieWithPreference])
def my_movies(
    preference: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = (
        select(models.Movie, user_movie_preferences.c.preference)
        .join(user_movie_preferences, models.Movie.id == user_movie_preferences.c.movie_id)
        .where(user_movie_preferences.c.user_id == current_user.id)
    )
    if preference is not None:
        query = query.where(user_movie_preferences.c.preference == preference)
    rows = db.execute(query).all()
    result = []
    for movie, pref in rows:
        result.append(
            MovieWithPreference(
                id=movie.id,
                title=movie.title,
                year=movie.year,
                genre=movie.genre,
                poster_url=movie.poster_url,
                description=movie.description,
                imdb_url=movie.imdb_url,
                preference=pref,
            )
        )
    return result


# --- Event routes ---

@app.post("/events", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    event = models.MovieNightEvent(
        name=payload.name,
        scheduled_at=payload.scheduled_at,
        location=payload.location,
        organizer_id=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    db.execute(
        event_attendees.insert().values(event_id=event.id, user_id=current_user.id)
    )
    db.commit()
    db.refresh(event)
    return event


@app.get("/events", response_model=List[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    organized = db.query(models.MovieNightEvent).filter(
        models.MovieNightEvent.organizer_id == current_user.id
    ).all()
    attending = current_user.attending_events

    seen_ids = set()
    events = []
    for event in organized + attending:
        if event.id not in seen_ids:
            seen_ids.add(event.id)
            events.append(event)
    return events


@app.get("/events/{event_id}", response_model=EventDetail)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    event = db.query(models.MovieNightEvent).filter(models.MovieNightEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    is_organizer = event.organizer_id == current_user.id
    is_attendee = any(a.id == current_user.id for a in event.attendees)

    if not (is_organizer or is_attendee):
        raise HTTPException(status_code=403, detail="Access denied")

    # Build ranked movie list
    movie_scores = []
    for movie in event.movies:
        score = 0
        has_dont_watch_without_me = False
        for attendee in event.attendees:
            row = db.execute(
                select(user_movie_preferences.c.preference).where(
                    user_movie_preferences.c.user_id == attendee.id,
                    user_movie_preferences.c.movie_id == movie.id,
                )
            ).first()
            if row:
                pref = row[0]
                score += PREFERENCE_SCORES.get(pref, 0)
                if pref == "dont_watch_without_me":
                    has_dont_watch_without_me = True
        movie_scores.append(
            MovieScore(
                id=movie.id,
                title=movie.title,
                year=movie.year,
                genre=movie.genre,
                poster_url=movie.poster_url,
                imdb_url=movie.imdb_url,
                description=movie.description,
                score=score,
                has_dont_watch_without_me=has_dont_watch_without_me,
            )
        )
    movie_scores.sort(key=lambda m: m.score, reverse=True)

    return EventDetail(
        id=event.id,
        name=event.name,
        scheduled_at=event.scheduled_at,
        location=event.location,
        organizer=event.organizer,
        attendees=event.attendees,
        movies=movie_scores,
    )


@app.post("/events/{event_id}/movies", status_code=204)
def add_movie_to_event(
    event_id: int,
    payload: AddMovieToEvent,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    event = db.query(models.MovieNightEvent).filter(models.MovieNightEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    is_organizer = event.organizer_id == current_user.id
    is_attendee = any(a.id == current_user.id for a in event.attendees)
    if not (is_organizer or is_attendee):
        raise HTTPException(status_code=403, detail="Access denied")

    movie = db.query(models.Movie).filter(models.Movie.id == payload.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    if any(m.id == movie.id for m in event.movies):
        raise HTTPException(status_code=400, detail="Movie already in event")

    db.execute(event_movies.insert().values(event_id=event_id, movie_id=movie.id))
    db.commit()


@app.delete("/events/{event_id}/movies/{movie_id}", status_code=204)
def remove_movie_from_event(
    event_id: int,
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    event = db.query(models.MovieNightEvent).filter(models.MovieNightEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    is_organizer = event.organizer_id == current_user.id
    is_attendee = any(a.id == current_user.id for a in event.attendees)
    if not (is_organizer or is_attendee):
        raise HTTPException(status_code=403, detail="Access denied")

    db.execute(
        event_movies.delete().where(
            event_movies.c.event_id == event_id,
            event_movies.c.movie_id == movie_id,
        )
    )
    db.commit()


@app.post("/events/{event_id}/invites", status_code=201)
def invite_user(
    event_id: int,
    payload: InviteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    event = db.query(models.MovieNightEvent).filter(models.MovieNightEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can invite users")

    invitee = db.query(models.User).filter(models.User.username == payload.username).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="User not found")

    already_attending = any(a.id == invitee.id for a in event.attendees)
    already_invited = db.query(models.EventInvitation).filter(
        models.EventInvitation.event_id == event_id,
        models.EventInvitation.user_id == invitee.id,
    ).first() is not None

    if already_attending or already_invited:
        raise HTTPException(status_code=400, detail="User is already attending or invited")

    invitation = models.EventInvitation(
        event_id=event_id,
        user_id=invitee.id,
        status="pending",
    )
    db.add(invitation)
    db.commit()


class AttendeePreference(BaseModel):
    user_id: int
    username: str
    preference: Optional[str]

class MovieSuggestion(BaseModel):
    id: int
    title: str
    year: Optional[int]
    genre: Optional[str]
    poster_url: Optional[str]
    imdb_url: Optional[str]
    score: int
    in_event: bool
    has_veto: bool
    attendee_preferences: List[AttendeePreference]


@app.get("/events/{event_id}/suggestions", response_model=List[MovieSuggestion])
def event_suggestions(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    event = db.query(models.MovieNightEvent).filter(models.MovieNightEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    is_organizer = event.organizer_id == current_user.id
    is_attendee = any(a.id == current_user.id for a in event.attendees)
    if not (is_organizer or is_attendee):
        raise HTTPException(status_code=403, detail="Access denied")

    attendees = event.attendees
    event_movie_ids = {m.id for m in event.movies}
    all_movies = db.query(models.Movie).all()

    suggestions = []
    for movie in all_movies:
        score = 0
        has_veto = False
        attendee_prefs = []
        for attendee in attendees:
            row = db.execute(
                select(user_movie_preferences.c.preference).where(
                    user_movie_preferences.c.user_id == attendee.id,
                    user_movie_preferences.c.movie_id == movie.id,
                )
            ).first()
            pref = row[0] if row else None
            attendee_prefs.append(AttendeePreference(
                user_id=attendee.id,
                username=attendee.username,
                preference=pref,
            ))
            if pref:
                score += PREFERENCE_SCORES.get(pref, 0)
                if pref == "dont_want_to_watch":
                    has_veto = True

        suggestions.append(MovieSuggestion(
            id=movie.id,
            title=movie.title,
            year=movie.year,
            genre=movie.genre,
            poster_url=movie.poster_url,
            imdb_url=movie.imdb_url,
            score=score,
            in_event=movie.id in event_movie_ids,
            has_veto=has_veto,
            attendee_preferences=attendee_prefs,
        ))

    suggestions.sort(key=lambda m: (not m.in_event, m.has_veto, -m.score))
    return suggestions


@app.get("/users/me/invites", response_model=List[InviteOut])
def my_invites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.EventInvitation)
        .filter(
            models.EventInvitation.user_id == current_user.id,
            models.EventInvitation.status == "pending",
        )
        .all()
    )


@app.post("/events/{event_id}/invites/respond", status_code=204)
def respond_to_invite(
    event_id: int,
    payload: InviteRespond,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    invitation = db.query(models.EventInvitation).filter(
        models.EventInvitation.event_id == event_id,
        models.EventInvitation.user_id == current_user.id,
        models.EventInvitation.status == "pending",
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation.status = payload.status
    if payload.status == "accepted":
        db.execute(
            event_attendees.insert().values(event_id=event_id, user_id=current_user.id)
        )
    db.commit()

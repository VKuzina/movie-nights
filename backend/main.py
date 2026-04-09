from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import models
from database import engine, get_db
from auth import hash_password, verify_password, create_access_token, get_current_user

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Movie Nights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    model_config = {"from_attributes": True}

class MovieOut(BaseModel):
    id: int
    title: str
    year: Optional[int]
    genre: Optional[str]
    poster_url: Optional[str]
    description: Optional[str]
    model_config = {"from_attributes": True}

class MovieCreate(BaseModel):
    title: str
    year: Optional[int] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    description: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str


# --- Auth routes ---

@app.post("/auth/register", response_model=UserOut, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
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
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Movie routes ---

@app.get("/movies", response_model=list[MovieOut])
def list_movies(db: Session = Depends(get_db)):
    return db.query(models.Movie).all()


@app.post("/movies", response_model=MovieOut, status_code=201)
def add_movie(payload: MovieCreate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    movie = models.Movie(**payload.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@app.post("/movies/{movie_id}/like", status_code=204)
def like_movie(movie_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    if movie not in current_user.liked_movies:
        current_user.liked_movies.append(movie)
        db.commit()


@app.delete("/movies/{movie_id}/like", status_code=204)
def unlike_movie(movie_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    if movie in current_user.liked_movies:
        current_user.liked_movies.remove(movie)
        db.commit()


@app.get("/users/me/liked-movies", response_model=list[MovieOut])
def my_liked_movies(current_user: models.User = Depends(get_current_user)):
    return current_user.liked_movies

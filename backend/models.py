from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

# Association: users <-> liked movies
user_liked_movies = Table(
    "user_liked_movies",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("movie_id", Integer, ForeignKey("movies.id"), primary_key=True),
)

# Association: movie nights <-> movies
event_movies = Table(
    "event_movies",
    Base.metadata,
    Column("event_id", Integer, ForeignKey("movie_night_events.id"), primary_key=True),
    Column("movie_id", Integer, ForeignKey("movies.id"), primary_key=True),
)

# Association: movie nights <-> attendees
event_attendees = Table(
    "event_attendees",
    Base.metadata,
    Column("event_id", Integer, ForeignKey("movie_night_events.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    liked_movies = relationship("Movie", secondary=user_liked_movies, back_populates="liked_by")
    organized_events = relationship("MovieNightEvent", back_populates="organizer")
    attending_events = relationship("MovieNightEvent", secondary=event_attendees, back_populates="attendees")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    year = Column(Integer)
    genre = Column(String)
    poster_url = Column(String)
    description = Column(String)

    liked_by = relationship("User", secondary=user_liked_movies, back_populates="liked_movies")
    events = relationship("MovieNightEvent", secondary=event_movies, back_populates="movies")


class MovieNightEvent(Base):
    __tablename__ = "movie_night_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    scheduled_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    organizer = relationship("User", back_populates="organized_events")
    movies = relationship("Movie", secondary=event_movies, back_populates="events")
    attendees = relationship("User", secondary=event_attendees, back_populates="attending_events")

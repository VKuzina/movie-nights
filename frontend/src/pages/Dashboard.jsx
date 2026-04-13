import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

function useMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth <= 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}
import { api } from "../api/client";
import AddMovieModal from "../components/AddMovieModal";
import MovieModal from "../components/MovieModal";

function matchesSearch(movie, query) {
  const q = query.toLowerCase();
  return (
    movie.title?.toLowerCase().includes(q) ||
    movie.genre?.toLowerCase().includes(q) ||
    String(movie.year || "").includes(q)
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [prefMap, setPrefMap] = useState({});
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const modalPushed = useRef(false);

  const openMovieModal = (movie) => {
    setSelectedMovie(movie);
    window.history.pushState({ modal: true }, "");
    modalPushed.current = true;
  };
  const closeMovieModal = () => {
    setSelectedMovie(null);
    if (modalPushed.current) { modalPushed.current = false; window.history.back(); }
  };
  useEffect(() => {
    if (!selectedMovie) return;
    const onPop = () => { modalPushed.current = false; setSelectedMovie(null); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [selectedMovie]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([api.me(), api.listMovies(), api.myMovies()])
      .then(([me, all, myMovies]) => {
        setUser(me);
        setMovies(all);
        const map = {};
        myMovies.forEach((m) => { map[m.id] = m.preference; });
        setPrefMap(map);
      })
      .catch((err) => { if (err.status === 401) { api.logout(); navigate("/login"); } });
  }, [navigate]);

  const handlePreference = async (movieId, value) => {
    const prev = prefMap[movieId];
    setPrefMap((m) => ({ ...m, [movieId]: value || undefined }));
    try {
      if (value) {
        await api.setPreference(movieId, value);
      } else {
        await api.deletePreference(movieId);
      }
    } catch (err) {
      setPrefMap((m) => ({ ...m, [movieId]: prev }));
      setError(err.message);
    }
  };

  const handleMovieSaved = (movie) => {
    setMovies((prev) => [...prev, movie]);
    setShowAddModal(false);
  };

  if (!user) return <div style={{ color: "#aaa", padding: "2rem" }}>Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0f0f0" }}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main className="page-main" style={{ padding: "2rem 2rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Browse Movies</h2>
            <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.3rem" }}>
              {search
                ? `${movies.filter(m => matchesSearch(m, search)).length} results for "${search}"`
                : `${movies.length} movies in the catalog`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={addBtnStyle}>
            + Add Movie
          </button>
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: "1.8rem" }}>
          <span style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#555", pointerEvents: "none", fontSize: "1rem" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by title, genre, year…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.65rem 0.9rem 0.65rem 2.4rem",
              borderRadius: "10px", border: "1px solid #2a2a2a",
              background: "#161616", color: "#f0f0f0", fontSize: "0.95rem",
              boxSizing: "border-box", outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
            >×</button>
          )}
        </div>

        {error && <p style={{ color: "#e50914", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}
        {(() => {
          const visible = search ? movies.filter(m => matchesSearch(m, search)) : movies;
          if (movies.length === 0) return (
            <div style={{ textAlign: "center", padding: "6rem 0", color: "#444" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</div>
              <p>No movies yet. Add the first one!</p>
            </div>
          );
          if (visible.length === 0) return (
            <div style={{ textAlign: "center", padding: "6rem 0", color: "#444" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
              <p>No movies match "<strong style={{ color: "#aaa" }}>{search}</strong>"</p>
            </div>
          );
          return (
            <div className="movie-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.5rem" }}>
              {visible.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  preference={prefMap[movie.id]}
                  onPreferenceChange={(val) => handlePreference(movie.id, val)}
                  onClick={() => openMovieModal(movie)}
                />
              ))}
            </div>
          );
        })()}
      </main>
      {showAddModal && (
        <AddMovieModal onClose={() => setShowAddModal(false)} onSaved={handleMovieSaved} />
      )}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          allMovies={movies}
          preference={prefMap[selectedMovie.id]}
          onPreferenceChange={(val) => handlePreference(selectedMovie.id, val)}
          onClose={closeMovieModal}
          onSelectMovie={(m) => { setSelectedMovie(m); window.history.replaceState({ modal: true }, ""); }}
        />
      )}
    </div>
  );
}

export function Nav({ username, onLogout }) {
  const location = useLocation();
  const isMobile = useMobile();
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  const navLinks = (
    <>
      <Link to="/" className={`nav-link${isActive("/") ? " active" : ""}`} style={navStyles.link}>Browse</Link>
      <Link to="/lists" className={`nav-link${isActive("/lists") ? " active" : ""}`} style={navStyles.link}>My Lists</Link>
      <Link to="/events" className={`nav-link${isActive("/events") ? " active" : ""}`} style={navStyles.link}>Events</Link>
    </>
  );

  if (isMobile) {
    return (
      <header style={{ ...navStyles.header, height: "auto", padding: "0.6rem 1rem", flexDirection: "column", gap: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={navStyles.logo}>🎬 Movie Nights</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={navStyles.avatar}>{username[0].toUpperCase()}</span>
            <button className="btn-ghost" onClick={onLogout} style={navStyles.logoutBtn}>Sign out</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", width: "100%", paddingTop: "0.4rem", paddingBottom: "0.1rem", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.5rem" }}>
          {navLinks}
        </div>
      </header>
    );
  }

  return (
    <header style={navStyles.header}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <span style={navStyles.logo}>🎬 Movie Nights</span>
      </Link>
      <nav style={navStyles.links}>{navLinks}</nav>
      <div style={navStyles.right}>
        <span style={navStyles.avatar}>{username[0].toUpperCase()}</span>
        <span style={navStyles.username}>{username}</span>
        <button className="btn-ghost" onClick={onLogout} style={navStyles.logoutBtn}>Sign out</button>
      </div>
    </header>
  );
}

export function PosterImage({ movie, eager }) {
  const [failed, setFailed] = useState(false);

  if (!movie.poster_url || failed) {
    return (
      <div className="poster-placeholder">
        <span>🎬</span>
        <span>{movie.year || ""}</span>
      </div>
    );
  }

  return (
    <div className="poster-wrap">
      <img
        src={movie.poster_url}
        alt={movie.title}
        referrerPolicy="no-referrer"
        loading={eager ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function MovieCard({ movie, preference, onPreferenceChange, onClick }) {
  return (
    <div className="movie-card fade-up" style={cardStyles.card}>
      {/* Clickable poster area */}
      <div onClick={onClick} style={{ cursor: "pointer" }}>
        <PosterImage movie={movie} />
      </div>
      <div style={cardStyles.body}>
        <h3 style={{ ...cardStyles.title, cursor: "pointer" }} title={movie.title} onClick={onClick}>{movie.title}</h3>
        <div style={cardStyles.meta}>
          {movie.year && <span style={cardStyles.year}>{movie.year}</span>}
          {movie.genre && <span className="genre-badge">{movie.genre}</span>}
        </div>
        <div style={cardStyles.links}>
          {movie.imdb_url && (
            <a href={movie.imdb_url} target="_blank" rel="noreferrer" style={cardStyles.imdbLink}>
              IMDb ↗
            </a>
          )}
        </div>
        <select
          className="pref-select"
          value={preference || ""}
          onChange={(e) => onPreferenceChange(e.target.value)}
          style={cardStyles.select}
        >
          <option value="">— No preference —</option>
          <option value="want_to_watch">✓ Want to watch</option>
          <option value="can_watch_if_needed">~ Can watch if needed</option>
          <option value="already_watched">✓ Already watched</option>
          <option value="dont_watch_without_me">⚠ Don't watch without me</option>
          <option value="dont_want_to_watch">✗ Don't want to watch</option>
        </select>
      </div>
    </div>
  );
}


const addBtnStyle = {
  padding: "0.55rem 1.3rem",
  borderRadius: "8px",
  border: "none",
  background: "#e50914",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
  letterSpacing: "0.02em",
};

const navStyles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 2rem",
    height: "60px",
    background: "rgba(13,13,13,0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  logo: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.01em",
  },
  links: { display: "flex", gap: "2rem" },
  link: { color: "#aaa", fontWeight: 500 },
  right: { display: "flex", alignItems: "center", gap: "0.75rem" },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #e50914, #b00710)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  username: { color: "#aaa", fontSize: "0.85rem" },
  logoutBtn: {
    padding: "0.35rem 0.85rem",
    borderRadius: "6px",
    border: "1px solid #2a2a2a",
    background: "transparent",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "0.82rem",
  },
};

const cardStyles = {
  card: {
    background: "#161616",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  body: {
    padding: "0.85rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1,
  },
  title: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#f0f0f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.3,
  },
  meta: { display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" },
  year: { color: "#666", fontSize: "0.78rem" },
  links: { marginTop: "auto" },
  imdbLink: {
    color: "#f5c518",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    transition: "opacity 0.15s",
  },
  select: {
    marginTop: "0.4rem",
    padding: "0.45rem 0.6rem",
    borderRadius: "7px",
    border: "1px solid #2a2a2a",
    background: "#0d0d0d",
    color: "#ccc",
    fontSize: "0.78rem",
    cursor: "pointer",
    width: "100%",
  },
};

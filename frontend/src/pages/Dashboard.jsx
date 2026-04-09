import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import AddMovieModal from "../components/AddMovieModal";

const PREFERENCE_LABELS = {
  want_to_watch: "Want to watch",
  can_watch_if_needed: "Can watch if needed",
  already_watched: "Already watched",
  dont_watch_without_me: "Don't watch without me",
  dont_want_to_watch: "Don't want to watch",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [prefMap, setPrefMap] = useState({});
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

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

  if (!user) return <div style={{ color: "#fff", padding: "2rem" }}>Loading…</div>;

  return (
    <div style={styles.page}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main style={styles.main}>
        <div style={styles.topBar}>
          <h2 style={styles.sectionTitle}>Browse Movies</h2>
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Add Movie</button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
        {movies.length === 0 ? (
          <p style={styles.empty}>No movies yet. Add the first one!</p>
        ) : (
          <div style={styles.grid}>
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                preference={prefMap[movie.id]}
                onPreferenceChange={(val) => handlePreference(movie.id, val)}
              />
            ))}
          </div>
        )}
      </main>
      {showAddModal && (
        <AddMovieModal onClose={() => setShowAddModal(false)} onSaved={handleMovieSaved} />
      )}
    </div>
  );
}

function Nav({ username, onLogout }) {
  return (
    <header style={navStyles.header}>
      <span style={navStyles.logo}>Movie Nights</span>
      <nav style={navStyles.links}>
        <Link to="/" style={navStyles.link}>Browse</Link>
        <Link to="/lists" style={navStyles.link}>My Lists</Link>
        <Link to="/events" style={navStyles.link}>Events</Link>
      </nav>
      <div style={navStyles.right}>
        <span style={navStyles.username}>Hi, {username}</span>
        <button style={navStyles.logoutBtn} onClick={onLogout}>Sign out</button>
      </div>
    </header>
  );
}

function MovieCard({ movie, preference, onPreferenceChange }) {
  return (
    <div style={cardStyles.card}>
      {movie.poster_url && (
        <img src={movie.poster_url} alt={movie.title} style={cardStyles.poster} />
      )}
      <div style={cardStyles.body}>
        <h3 style={cardStyles.title}>{movie.title}</h3>
        <div style={cardStyles.meta}>
          {movie.year && <span>{movie.year}</span>}
          {movie.genre && <span> · {movie.genre}</span>}
        </div>
        {movie.description && <p style={cardStyles.desc}>{movie.description}</p>}
        {movie.imdb_url && (
          <a href={movie.imdb_url} target="_blank" rel="noreferrer" style={cardStyles.imdbLink}>
            View on IMDB ↗
          </a>
        )}
        <select
          value={preference || ""}
          onChange={(e) => onPreferenceChange(e.target.value)}
          style={cardStyles.select}
        >
          <option value="">— No preference —</option>
          <option value="want_to_watch">Want to watch</option>
          <option value="can_watch_if_needed">Can watch if needed</option>
          <option value="already_watched">Already watched</option>
          <option value="dont_watch_without_me">Don't watch without me</option>
          <option value="dont_want_to_watch">Don't want to watch</option>
        </select>
      </div>
    </div>
  );
}

export { Nav };

const styles = {
  page: { minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "sans-serif" },
  main: { padding: "2rem" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  sectionTitle: { margin: 0 },
  addBtn: { padding: "0.5rem 1.2rem", borderRadius: "6px", border: "none", background: "#e50914", color: "#fff", cursor: "pointer", fontWeight: 600 },
  error: { color: "#e50914", marginBottom: "1rem" },
  empty: { color: "#666" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" },
};

const navStyles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", background: "#1a1a1a", borderBottom: "1px solid #222" },
  logo: { fontSize: "1.4rem", fontWeight: 700 },
  links: { display: "flex", gap: "1.5rem" },
  link: { color: "#ccc", textDecoration: "none", fontSize: "0.95rem" },
  right: { display: "flex", alignItems: "center", gap: "1rem" },
  username: { color: "#aaa" },
  logoutBtn: { padding: "0.4rem 0.9rem", borderRadius: "6px", border: "1px solid #444", background: "transparent", color: "#fff", cursor: "pointer" },
};

const cardStyles = {
  card: { background: "#1e1e1e", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column" },
  poster: { width: "100%", aspectRatio: "2/3", objectFit: "cover" },
  body: { padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 },
  title: { margin: 0, fontSize: "1rem" },
  meta: { color: "#aaa", fontSize: "0.85rem" },
  desc: { color: "#888", fontSize: "0.85rem", margin: 0 },
  imdbLink: { color: "#f5c518", fontSize: "0.8rem", textDecoration: "none" },
  select: { marginTop: "auto", padding: "0.45rem 0.5rem", borderRadius: "6px", border: "1px solid #444", background: "#111", color: "#fff", fontSize: "0.85rem", cursor: "pointer" },
};

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Nav, PosterImage } from "./Dashboard";
import MovieModal from "../components/MovieModal";

const TABS = [
  { key: "want_to_watch", label: "Want to Watch", color: "#2ecc71" },
  { key: "can_watch_if_needed", label: "Can Watch", color: "#f5c518" },
  { key: "already_watched", label: "Already Watched", color: "#888" },
  { key: "dont_watch_without_me", label: "Don't Watch Without Me", color: "#f39c12" },
  { key: "dont_want_to_watch", label: "Don't Want", color: "#e74c3c" },
];

export default function MyLists() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("want_to_watch");
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [prefMap, setPrefMap] = useState({});
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    Promise.all([api.me(), api.listMovies(), api.myMovies()])
      .then(([me, all, myMovies]) => {
        setUser(me);
        setAllMovies(all);
        const map = {};
        myMovies.forEach((m) => { map[m.id] = m.preference; });
        setPrefMap(map);
      })
      .catch((err) => { if (err.status === 401) { api.logout(); navigate("/login"); } });
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    api.myMovies(tab).then((m) => { setMovies(m); setLoading(false); });
  }, [tab]);

  const handlePreferenceChange = async (movieId, value) => {
    setPrefMap((m) => ({ ...m, [movieId]: value || undefined }));
    try {
      if (value) await api.setPreference(movieId, value);
      else await api.deletePreference(movieId);
      const updated = await api.myMovies(tab);
      setMovies(updated);
    } catch (e) { /* ignore */ }
  };

  const activeTab = TABS.find((t) => t.key === tab);

  if (!user) return <div style={{ color: "#aaa", padding: "2rem" }}>Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0f0f0" }}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main className="page-main" style={{ padding: "2rem 2rem 4rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>My Lists</h2>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                border: `1px solid ${tab === t.key ? t.color : "#2a2a2a"}`,
                background: tab === t.key ? t.color + "22" : "transparent",
                color: tab === t.key ? t.color : "#666",
                cursor: "pointer",
                fontSize: "0.83rem",
                fontWeight: tab === t.key ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "#555" }}>Loading…</p>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "#444" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
              {activeTab?.key === "want_to_watch" ? "🍿" : activeTab?.key === "already_watched" ? "✅" : "🎬"}
            </div>
            <p>No movies in this list yet.</p>
          </div>
        ) : (
          <>
            <p style={{ color: "#555", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
              {movies.length} movie{movies.length !== 1 ? "s" : ""}
            </p>
            <div className="movie-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.5rem" }}>
              {movies.map((movie) => (
                <ListMovieCard key={movie.id} movie={movie} onPreferenceChange={handlePreferenceChange} onClick={() => openMovieModal(movie)} />
              ))}
            </div>
          </>
        )}
      </main>
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          allMovies={allMovies}
          preference={prefMap[selectedMovie.id]}
          onPreferenceChange={(val) => handlePreferenceChange(selectedMovie.id, val)}
          onClose={closeMovieModal}
          onSelectMovie={(m) => { setSelectedMovie(m); window.history.replaceState({ modal: true }, ""); }}
        />
      )}
    </div>
  );
}

function ListMovieCard({ movie, onPreferenceChange, onClick }) {
  return (
    <div className="movie-card fade-up" style={cardStyle}>
      <div onClick={onClick} style={{ cursor: "pointer" }}>
        <PosterImage movie={movie} />
      </div>
      <div style={bodyStyle}>
        <h3 style={{ ...titleStyle, cursor: "pointer" }} title={movie.title} onClick={onClick}>{movie.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          {movie.year && <span style={{ color: "#666", fontSize: "0.78rem" }}>{movie.year}</span>}
          {movie.genre && <span className="genre-badge">{movie.genre}</span>}
        </div>
        {movie.imdb_url && (
          <a href={movie.imdb_url} target="_blank" rel="noreferrer" style={{ color: "#f5c518", fontSize: "0.75rem", fontWeight: 600, marginTop: "auto" }}>
            IMDb ↗
          </a>
        )}
        <select
          className="pref-select"
          value={movie.preference || ""}
          onChange={(e) => onPreferenceChange(movie.id, e.target.value)}
          style={{ marginTop: "0.4rem", padding: "0.45rem 0.6rem", borderRadius: "7px", border: "1px solid #2a2a2a", background: "#0d0d0d", color: "#ccc", fontSize: "0.78rem", cursor: "pointer", width: "100%" }}
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

const cardStyle = { background: "#161616", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.05)" };
const bodyStyle = { padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 };
const titleStyle = { fontSize: "0.9rem", fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 };

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Nav } from "./Dashboard";

const TABS = [
  { key: "want_to_watch", label: "Want to Watch" },
  { key: "can_watch_if_needed", label: "Can Watch" },
  { key: "already_watched", label: "Already Watched" },
  { key: "dont_watch_without_me", label: "Don't Watch Without Me" },
  { key: "dont_want_to_watch", label: "Don't Want" },
];

export default function MyLists() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("want_to_watch");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch((err) => { if (err.status === 401) { api.logout(); navigate("/login"); } });
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    api.myMovies(tab).then((m) => { setMovies(m); setLoading(false); });
  }, [tab]);

  const handlePreferenceChange = async (movieId, value) => {
    try {
      if (value) await api.setPreference(movieId, value);
      else await api.deletePreference(movieId);
      const updated = await api.myMovies(tab);
      setMovies(updated);
    } catch (e) { /* ignore */ }
  };

  if (!user) return <div style={{ color: "#fff", padding: "2rem" }}>Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "sans-serif" }}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main style={{ padding: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>My Lists</h2>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "20px",
                border: "1px solid #444",
                background: tab === t.key ? "#e50914" : "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : movies.length === 0 ? (
          <p style={{ color: "#666" }}>No movies in this list yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {movies.map((movie) => (
              <div key={movie.id} style={{ background: "#1e1e1e", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {movie.poster_url && (
                  <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover" }} />
                )}
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>{movie.title}</h3>
                  <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                    {movie.year && <span>{movie.year}</span>}
                    {movie.genre && <span> · {movie.genre}</span>}
                  </div>
                  {movie.imdb_url && (
                    <a href={movie.imdb_url} target="_blank" rel="noreferrer" style={{ color: "#f5c518", fontSize: "0.8rem", textDecoration: "none" }}>
                      View on IMDB ↗
                    </a>
                  )}
                  <select
                    value={movie.preference || ""}
                    onChange={(e) => handlePreferenceChange(movie.id, e.target.value)}
                    style={{ marginTop: "auto", padding: "0.45rem 0.5rem", borderRadius: "6px", border: "1px solid #444", background: "#111", color: "#fff", fontSize: "0.85rem", cursor: "pointer" }}
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

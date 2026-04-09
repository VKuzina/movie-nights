import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.me(), api.listMovies(), api.myLikedMovies()])
      .then(([me, all, liked]) => {
        setUser(me);
        setMovies(all);
        setLikedIds(new Set(liked.map((m) => m.id)));
      })
      .catch(() => {
        api.logout();
        navigate("/login");
      });
  }, [navigate]);

  const toggleLike = async (movie) => {
    try {
      if (likedIds.has(movie.id)) {
        await api.unlikeMovie(movie.id);
        setLikedIds((prev) => { const s = new Set(prev); s.delete(movie.id); return s; });
      } else {
        await api.likeMovie(movie.id);
        setLikedIds((prev) => new Set([...prev, movie.id]));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  if (!user) return <div style={{ color: "#fff", padding: "2rem" }}>Loading...</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>Movie Nights</span>
        <div style={styles.headerRight}>
          <span style={styles.username}>Hi, {user.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        <h2 style={styles.sectionTitle}>Browse Movies</h2>
        {error && <p style={styles.error}>{error}</p>}
        {movies.length === 0 ? (
          <p style={styles.empty}>No movies yet. Add some via the API.</p>
        ) : (
          <div style={styles.grid}>
            {movies.map((movie) => (
              <div key={movie.id} style={styles.card}>
                {movie.poster_url && (
                  <img src={movie.poster_url} alt={movie.title} style={styles.poster} />
                )}
                <div style={styles.cardBody}>
                  <h3 style={styles.movieTitle}>{movie.title}</h3>
                  {movie.year && <span style={styles.meta}>{movie.year}</span>}
                  {movie.genre && <span style={styles.meta}> · {movie.genre}</span>}
                  {movie.description && <p style={styles.desc}>{movie.description}</p>}
                  <button
                    style={{ ...styles.likeBtn, background: likedIds.has(movie.id) ? "#e50914" : "#333" }}
                    onClick={() => toggleLike(movie)}
                  >
                    {likedIds.has(movie.id) ? "Liked" : "Like"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", background: "#1a1a1a", borderBottom: "1px solid #222" },
  logo: { fontSize: "1.4rem", fontWeight: 700 },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem" },
  username: { color: "#aaa" },
  logoutBtn: { padding: "0.4rem 0.9rem", borderRadius: "6px", border: "1px solid #444", background: "transparent", color: "#fff", cursor: "pointer" },
  main: { padding: "2rem" },
  sectionTitle: { marginBottom: "1.5rem" },
  error: { color: "#e50914" },
  empty: { color: "#666" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" },
  card: { background: "#1e1e1e", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column" },
  poster: { width: "100%", aspectRatio: "2/3", objectFit: "cover" },
  cardBody: { padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 },
  movieTitle: { margin: 0, fontSize: "1rem" },
  meta: { color: "#aaa", fontSize: "0.85rem" },
  desc: { color: "#888", fontSize: "0.85rem", margin: 0 },
  likeBtn: { marginTop: "auto", padding: "0.5rem", borderRadius: "6px", border: "none", color: "#fff", cursor: "pointer", fontWeight: 600 },
};

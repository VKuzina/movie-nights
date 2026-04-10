import { useEffect } from "react";
import { PosterImage } from "../pages/Dashboard";

const PREF_OPTIONS = [
  { value: "",                    label: "— No preference —" },
  { value: "want_to_watch",       label: "✓ Want to watch" },
  { value: "can_watch_if_needed", label: "~ Can watch if needed" },
  { value: "already_watched",     label: "✓ Already watched" },
  { value: "dont_watch_without_me", label: "⚠ Don't watch without me" },
  { value: "dont_want_to_watch",  label: "✗ Don't want to watch" },
];

const PREF_COLOR = {
  want_to_watch:         "#2ecc71",
  can_watch_if_needed:   "#f5c518",
  already_watched:       "#888",
  dont_watch_without_me: "#f39c12",
  dont_want_to_watch:    "#e74c3c",
};

export default function MovieModal({ movie, allMovies, preference, onPreferenceChange, onClose, onSelectMovie }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const genres = movie.genre
    ? movie.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  // Similar movies: share at least one genre, exclude current, pick up to 6
  const similar = allMovies
    .filter((m) => {
      if (m.id === movie.id) return false;
      if (!m.genre || !movie.genre) return false;
      const mGenres = m.genre.split(",").map((g) => g.trim());
      return genres.some((g) => mGenres.includes(g));
    })
    .slice(0, 6);

  const prefColor = preference ? PREF_COLOR[preference] : null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle} className="fade-up">
        {/* Close button */}
        <button onClick={onClose} style={closeBtnStyle} aria-label="Close">✕</button>

        {/* Main content */}
        <div style={bodyStyle}>
          {/* Left: poster */}
          <div style={posterColStyle}>
            <PosterImage movie={movie} />
          </div>

          {/* Right: details */}
          <div style={detailsStyle}>
            <div>
              <h1 style={titleStyle}>{movie.title}</h1>

              <div style={metaRowStyle}>
                {movie.year && <span style={yearStyle}>{movie.year}</span>}
                {genres.map((g) => (
                  <span key={g} className="genre-badge">{g}</span>
                ))}
              </div>

              {movie.description && (
                <p style={descStyle}>{movie.description}</p>
              )}
            </div>

            <div style={actionsStyle}>
              {movie.imdb_url && (
                <a href={movie.imdb_url} target="_blank" rel="noreferrer" style={imdbBtnStyle}>
                  <span style={{ fontSize: "1rem" }}>⭐</span> View on IMDb
                </a>
              )}

              <div style={prefWrapStyle}>
                <label style={prefLabelStyle}>Your preference</label>
                <select
                  className="pref-select"
                  value={preference || ""}
                  onChange={(e) => onPreferenceChange(e.target.value)}
                  style={{
                    ...prefSelectStyle,
                    borderColor: prefColor ? prefColor + "66" : "#2a2a2a",
                    color: prefColor || "#ccc",
                    background: prefColor ? prefColor + "11" : "#0d0d0d",
                  }}
                >
                  {PREF_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Similar movies */}
        {similar.length > 0 && (
          <div style={similarSectionStyle}>
            <h3 style={similarTitleStyle}>More like this</h3>
            <div style={similarGridStyle}>
              {similar.map((m) => (
                <SimilarCard key={m.id} movie={m} onClick={() => onSelectMovie(m)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimilarCard({ movie, onClick }) {
  return (
    <div onClick={onClick} className="movie-card" style={similarCardStyle}>
      <PosterImage movie={movie} />
      <div style={similarCardBodyStyle}>
        <p style={similarCardTitleStyle} title={movie.title}>{movie.title}</p>
        {movie.year && <span style={{ color: "#555", fontSize: "0.72rem" }}>{movie.year}</span>}
      </div>
    </div>
  );
}

/* ── Styles ── */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(6px)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  overflowY: "auto",
};

const modalStyle = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  width: "100%",
  maxWidth: "860px",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
};

const closeBtnStyle = {
  position: "absolute",
  top: "1rem",
  right: "1rem",
  background: "rgba(255,255,255,0.08)",
  border: "none",
  color: "#aaa",
  fontSize: "1rem",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s, color 0.15s",
};

const bodyStyle = {
  display: "flex",
  gap: "2rem",
  padding: "2rem",
};

const posterColStyle = {
  flexShrink: 0,
  width: "200px",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
};

const detailsStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "1.5rem",
  minWidth: 0,
};

const titleStyle = {
  fontSize: "1.7rem",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  marginBottom: "0.75rem",
};

const metaRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
};

const yearStyle = {
  color: "#666",
  fontSize: "0.9rem",
  fontWeight: 500,
};

const descStyle = {
  color: "#999",
  fontSize: "0.9rem",
  lineHeight: 1.65,
};

const actionsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const imdbBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  background: "#f5c518",
  color: "#000",
  fontWeight: 700,
  fontSize: "0.85rem",
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  width: "fit-content",
  letterSpacing: "0.02em",
  transition: "filter 0.15s",
};

const prefWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const prefLabelStyle = {
  fontSize: "0.75rem",
  color: "#555",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const prefSelectStyle = {
  padding: "0.55rem 2rem 0.55rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #2a2a2a",
  fontSize: "0.88rem",
  cursor: "pointer",
  width: "100%",
  transition: "border-color 0.2s, color 0.2s, background 0.2s",
};

const similarSectionStyle = {
  borderTop: "1px solid rgba(255,255,255,0.06)",
  padding: "1.5rem 2rem 2rem",
};

const similarTitleStyle = {
  fontSize: "0.78rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#555",
  marginBottom: "1rem",
};

const similarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "0.75rem",
};

const similarCardStyle = {
  background: "#111",
  borderRadius: "8px",
  overflow: "hidden",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.04)",
};

const similarCardBodyStyle = {
  padding: "0.5rem",
};

const similarCardTitleStyle = {
  fontSize: "0.78rem",
  fontWeight: 500,
  color: "#ccc",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  margin: 0,
};

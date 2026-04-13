import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Nav } from "./Dashboard";

const PREF_LABEL = {
  want_to_watch: { label: "Wants to watch", color: "#2ecc71" },
  can_watch_if_needed: { label: "Can watch", color: "#f5c518" },
  already_watched: { label: "Seen it", color: "#888" },
  dont_watch_without_me: { label: "Don't watch without me", color: "#f39c12" },
  dont_want_to_watch: { label: "Doesn't want", color: "#e74c3c" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "no_veto", label: "No one objects" },
  { key: "someone_wants", label: "Someone wants it" },
  { key: "everyone_wants", label: "Everyone wants it" },
];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsFilter, setSuggestionsFilter] = useState("no_veto");
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("rankings"); // "rankings" | "picks"

  const loadAll = () =>
    Promise.all([api.me(), api.getEvent(Number(id)), api.eventSuggestions(Number(id))])
      .then(([me, evt, sugg]) => {
        setUser(me);
        setEvent(evt);
        setSuggestions(sugg);
      })
      .catch((err) => { if (err.status === 401) { api.logout(); navigate("/login"); } else setError(err.message); });

  useEffect(() => { loadAll(); }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    try {
      await api.inviteUser(Number(id), inviteUsername.trim());
      setInviteMsg(`Invited ${inviteUsername}!`);
      setInviteUsername("");
    } catch (err) {
      setInviteMsg(err.message);
    }
  };

  const handleAddToEvent = async (movieId) => {
    try {
      await api.addMovieToEvent(Number(id), movieId);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveFromEvent = async (movieId) => {
    try {
      await api.removeMovieFromEvent(Number(id), movieId);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreferenceChange = async (movieId, value) => {
    try {
      if (value) await api.setPreference(movieId, value);
      else await api.deletePreference(movieId);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user || !event) return <div style={{ color: "#fff", padding: "2rem" }}>Loading…</div>;

  const isOrganizer = event.organizer.id === user.id;

  const filteredSuggestions = suggestions.filter((m) => {
    if (suggestionsFilter === "no_veto") return !m.has_veto;
    if (suggestionsFilter === "someone_wants") return m.attendee_preferences.some((p) => p.preference === "want_to_watch");
    if (suggestionsFilter === "everyone_wants") return m.attendee_preferences.length > 0 && m.attendee_preferences.every((p) => p.preference === "want_to_watch");
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0f0f0" }}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main className="page-main" style={{ padding: "2rem 2rem 4rem", maxWidth: "960px" }}>
        {error && <p style={{ color: "#e50914", marginBottom: "1rem" }}>{error}</p>}

        <button onClick={() => navigate("/events")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", marginBottom: "1rem", padding: 0 }}>← Back to Events</button>

        <h1 style={{ margin: "0 0 0.3rem", fontSize: "1.8rem" }}>{event.name}</h1>
        <p style={{ color: "#aaa", margin: "0 0 0.2rem" }}>{formatDate(event.scheduled_at)}</p>
        {event.location && <p style={{ color: "#888", margin: "0 0 1.5rem" }}>📍 {event.location}</p>}
        <p style={{ color: "#666", fontSize: "0.85rem", margin: "0 0 2rem" }}>Organized by <strong style={{ color: "#ccc" }}>{event.organizer.username}</strong></p>

        {/* Attendees + Invite */}
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1rem", color: "#aaa", marginBottom: "0.8rem" }}>Attendees ({event.attendees.length})</h2>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: isOrganizer ? "1rem" : 0 }}>
            {event.attendees.map((a) => (
              <span key={a.id} style={{ background: "#2a2a2a", borderRadius: "20px", padding: "0.3rem 0.9rem", fontSize: "0.85rem" }}>{a.username}</span>
            ))}
          </div>
          {isOrganizer && (
            <form onSubmit={handleInvite} className="invite-form" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="Invite by username…"
                style={{ padding: "0.5rem 0.8rem", borderRadius: "6px", border: "1px solid #444", background: "#1a1a1a", color: "#fff", fontSize: "0.9rem" }}
              />
              <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: "#333", color: "#fff", cursor: "pointer" }}>Invite</button>
            </form>
          )}
          {inviteMsg && <p style={{ color: inviteMsg.includes("!") ? "#2ecc71" : "#e50914", fontSize: "0.85rem", marginTop: "0.5rem" }}>{inviteMsg}</p>}
        </section>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderBottom: "1px solid #2a2a2a" }}>
          {[["rankings", `Event Movies (${event.movies.length})`], ["picks", "Group Picks"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "0.6rem 1.4rem",
                background: "none",
                border: "none",
                borderBottom: activeTab === key ? "2px solid #e50914" : "2px solid transparent",
                color: activeTab === key ? "#fff" : "#666",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: activeTab === key ? 600 : 400,
                marginBottom: "-1px",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Event movie rankings */}
        {activeTab === "rankings" && (
          <section>
            {event.movies.length === 0 ? (
              <p style={{ color: "#666" }}>No movies added yet. Use "Group Picks" to find something everyone likes.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {event.movies.map((movie, idx) => (
                  <div key={movie.id} style={{ background: "#1e1e1e", borderRadius: "10px", padding: "1rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#555", minWidth: "2rem" }}>#{idx + 1}</span>
                    {movie.poster_url && (
                      <img src={movie.poster_url} alt={movie.title} referrerPolicy="no-referrer" loading="lazy" style={{ width: "50px", height: "75px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap" }}>
                        <strong>{movie.title}</strong>
                        {movie.year && <span style={{ color: "#aaa", fontSize: "0.85rem" }}>{movie.year}</span>}
                        {movie.genre && <span style={{ color: "#888", fontSize: "0.82rem" }}>{movie.genre}</span>}
                      </div>
                      {movie.imdb_url && (
                        <a href={movie.imdb_url} target="_blank" rel="noreferrer" style={{ color: "#f5c518", fontSize: "0.78rem", textDecoration: "none" }}>View on IMDB ↗</a>
                      )}
                      {movie.has_dont_watch_without_me && (
                        <p style={{ color: "#f39c12", fontSize: "0.82rem", margin: "0.3rem 0 0" }}>⚠️ Someone prefers not to watch without them</p>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                      <span style={{
                        padding: "0.25rem 0.6rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700,
                        background: movie.score > 0 ? "#1a3a1a" : movie.score < 0 ? "#3a1a1a" : "#2a2a2a",
                        color: movie.score > 0 ? "#2ecc71" : movie.score < 0 ? "#e74c3c" : "#888",
                      }}>
                        {movie.score > 0 ? "+" : ""}{movie.score}
                      </span>
                      <button
                        onClick={() => handleRemoveFromEvent(movie.id)}
                        style={{ fontSize: "0.75rem", color: "#555", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab: Group Picks */}
        {activeTab === "picks" && (
          <section>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Shows all movies with each attendee's preference. Add any to the event.
            </p>

            {/* Filter bar */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSuggestionsFilter(f.key)}
                  style={{
                    padding: "0.35rem 0.9rem", borderRadius: "20px", fontSize: "0.82rem",
                    border: "1px solid #444",
                    background: suggestionsFilter === f.key ? "#e50914" : "transparent",
                    color: "#fff", cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {event.attendees.length < 2 && (
              <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "1rem" }}>
                💡 Invite more people to the event to see their preferences here.
              </p>
            )}

            {filteredSuggestions.length === 0 ? (
              <p style={{ color: "#666" }}>No movies match this filter.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {filteredSuggestions.map((movie) => (
                  <div
                    key={movie.id}
                    style={{
                      background: movie.in_event ? "#1a2a1a" : "#1e1e1e",
                      borderRadius: "10px", padding: "0.9rem 1rem",
                      display: "flex", gap: "1rem", alignItems: "center",
                      borderLeft: movie.in_event ? "3px solid #2ecc71" : "3px solid transparent",
                    }}
                  >
                    {movie.poster_url && (
                      <img src={movie.poster_url} alt={movie.title} referrerPolicy="no-referrer" loading="lazy" style={{ width: "40px", height: "60px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{movie.title}</strong>
                        {movie.year && <span style={{ color: "#aaa", fontSize: "0.82rem" }}>{movie.year}</span>}
                        {movie.in_event && <span style={{ color: "#2ecc71", fontSize: "0.75rem" }}>✓ In event</span>}
                      </div>
                      {/* Attendee preference pills */}
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem", alignItems: "center" }}>
                        {movie.attendee_preferences.map((ap) => {
                          if (ap.user_id === user.id) {
                            return (
                              <div key={ap.user_id} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <span style={{ fontSize: "0.72rem", color: "#aaa" }}>You:</span>
                                <select
                                  value={ap.preference || ""}
                                  onChange={(e) => handlePreferenceChange(movie.id, e.target.value)}
                                  style={{
                                    fontSize: "0.72rem", padding: "0.1rem 0.4rem", borderRadius: "8px",
                                    border: "1px solid #555", background: "#1a1a1a", color: "#fff", cursor: "pointer",
                                  }}
                                >
                                  <option value="">— none —</option>
                                  <option value="want_to_watch">Want to watch</option>
                                  <option value="can_watch_if_needed">Can watch</option>
                                  <option value="already_watched">Seen it</option>
                                  <option value="dont_watch_without_me">Don't watch without me</option>
                                  <option value="dont_want_to_watch">Don't want</option>
                                </select>
                              </div>
                            );
                          }
                          const info = PREF_LABEL[ap.preference] || { label: "—", color: "#444" };
                          return (
                            <span
                              key={ap.user_id}
                              style={{
                                fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "10px",
                                background: ap.preference ? info.color + "22" : "#2a2a2a",
                                color: ap.preference ? info.color : "#555",
                                border: `1px solid ${ap.preference ? info.color + "55" : "#333"}`,
                              }}
                            >
                              {ap.username}: {ap.preference ? info.label : "—"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                      <span style={{
                        padding: "0.2rem 0.5rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700,
                        background: movie.score > 0 ? "#1a3a1a" : movie.score < 0 ? "#3a1a1a" : "#2a2a2a",
                        color: movie.score > 0 ? "#2ecc71" : movie.score < 0 ? "#e74c3c" : "#666",
                      }}>
                        {movie.score > 0 ? "+" : ""}{movie.score}
                      </span>
                      {movie.has_veto && <span style={{ fontSize: "0.72rem", color: "#e74c3c" }}>🚫 Veto</span>}
                      {movie.in_event ? (
                        <button
                          onClick={() => handleRemoveFromEvent(movie.id)}
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "6px", border: "1px solid #444", background: "transparent", color: "#888", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToEvent(movie.id)}
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "6px", border: "none", background: "#333", color: "#fff", cursor: "pointer" }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "No date set";
  return new Date(dt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
}

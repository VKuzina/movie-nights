import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Nav } from "./Dashboard";
import CreateEventModal from "../components/CreateEventModal";

export default function Events() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const loadData = () =>
    Promise.all([api.me(), api.listEvents(), api.myInvites()])
      .then(([me, evts, inv]) => {
        setUser(me);
        setEvents(evts);
        setInvites(inv);
      })
      .catch((err) => {
        if (err.status === 401) { api.logout(); navigate("/login"); }
        else setError(err.message || "Failed to load events");
      });

  useEffect(() => { loadData(); }, []);

  const handleRespond = async (eventId, status) => {
    try {
      await api.respondToInvite(eventId, status);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!user) return <div style={{ color: "#aaa", padding: "2rem" }}>Loading…</div>;

  const now = new Date();
  const upcoming = events.filter((e) => e.scheduled_at && new Date(e.scheduled_at) >= now);
  const past = events.filter((e) => !e.scheduled_at || new Date(e.scheduled_at) < now);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0f0f0" }}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main className="page-main" style={{ padding: "2rem 2rem 4rem" }}>
        {error && <p style={{ color: "#e50914", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}

        {/* Pending invites */}
        {invites.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <SectionHeader label="Pending Invites" count={invites.length} accent="#f5c518" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {invites.map((inv) => (
                <div key={inv.id} className="fade-up" style={inviteCardStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "1rem" }}>{inv.event.name}</strong>
                      <span style={{ color: "#555", fontSize: "0.8rem" }}>by {inv.event.organizer.username}</span>
                    </div>
                    <p style={{ color: "#888", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                      {formatDate(inv.event.scheduled_at)}
                      {inv.event.location && ` · 📍 ${inv.event.location}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      onClick={() => handleRespond(inv.event.id, "accepted")}
                      style={acceptBtnStyle}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleRespond(inv.event.id, "declined")}
                      style={declineBtnStyle}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Events</h2>
          <button
            className="btn-primary"
            onClick={() => setShowCreate(true)}
            style={{ padding: "0.55rem 1.3rem", borderRadius: "8px", border: "none", background: "#e50914", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
          >
            + Create Event
          </button>
        </div>

        {upcoming.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHeader label="Upcoming" count={upcoming.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {upcoming.map((evt) => <EventCard key={evt.id} event={evt} onClick={() => navigate(`/events/${evt.id}`)} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <SectionHeader label="Past" count={past.length} dim />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {past.map((evt) => <EventCard key={evt.id} event={evt} past onClick={() => navigate(`/events/${evt.id}`)} />)}
            </div>
          </div>
        )}

        {events.length === 0 && invites.length === 0 && (
          <div style={{ textAlign: "center", padding: "6rem 0", color: "#444" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <p>No events yet. Create one or wait for an invite!</p>
          </div>
        )}
      </main>
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onSaved={(evt) => { setEvents((prev) => [...prev, evt]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function SectionHeader({ label, count, accent, dim }) {
  return (
    <h3 style={{
      fontSize: "0.78rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: accent || (dim ? "#444" : "#555"),
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    }}>
      {label}
      {count !== undefined && (
        <span style={{ background: "#1e1e1e", borderRadius: "10px", padding: "0.1rem 0.5rem", fontSize: "0.72rem", color: "#555", fontWeight: 400 }}>
          {count}
        </span>
      )}
    </h3>
  );
}

function EventCard({ event, onClick, past }) {
  return (
    <div
      className="event-card fade-up"
      onClick={onClick}
      style={{
        background: past ? "#111" : "#161616",
        borderRadius: "12px",
        padding: "1.4rem",
        cursor: "pointer",
        borderLeft: `3px solid ${past ? "#2a2a2a" : "#e50914"}`,
        border: "1px solid rgba(255,255,255,0.05)",
        borderLeftWidth: "3px",
        borderLeftColor: past ? "#2a2a2a" : "#e50914",
        opacity: past ? 0.7 : 1,
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600, color: past ? "#888" : "#f0f0f0" }}>
        {event.name}
      </h3>
      <p style={{ margin: 0, color: "#666", fontSize: "0.82rem" }}>{formatDate(event.scheduled_at)}</p>
      {event.location && (
        <p style={{ margin: "0.25rem 0 0", color: "#555", fontSize: "0.8rem" }}>📍 {event.location}</p>
      )}
      <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#555" }}>by</span>
        <span style={{ fontSize: "0.78rem", color: "#888", fontWeight: 500 }}>{event.organizer.username}</span>
      </div>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "No date set";
  return new Date(dt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const inviteCardStyle = {
  background: "rgba(245,197,24,0.05)",
  border: "1px solid rgba(245,197,24,0.15)",
  borderRadius: "12px",
  padding: "1rem 1.2rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const acceptBtnStyle = {
  padding: "0.4rem 1rem",
  borderRadius: "7px",
  border: "none",
  background: "#2ecc71",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.85rem",
  transition: "filter 0.15s",
};

const declineBtnStyle = {
  padding: "0.4rem 0.9rem",
  borderRadius: "7px",
  border: "1px solid #2a2a2a",
  background: "transparent",
  color: "#666",
  cursor: "pointer",
  fontSize: "0.85rem",
};

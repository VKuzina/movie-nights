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

  if (!user) return <div style={{ color: "#fff", padding: "2rem" }}>Loading…</div>;

  const now = new Date();
  const upcoming = events.filter((e) => e.scheduled_at && new Date(e.scheduled_at) >= now);
  const past = events.filter((e) => !e.scheduled_at || new Date(e.scheduled_at) < now);

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "sans-serif" }}>
      <Nav username={user.username} onLogout={() => { api.logout(); navigate("/login"); }} />
      <main style={{ padding: "2rem" }}>
        {error && <p style={{ color: "#e50914", marginBottom: "1rem" }}>{error}</p>}

        {invites.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem", color: "#f5c518" }}>Pending Invites</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {invites.map((inv) => (
                <div key={inv.id} style={{ background: "#1e1e1e", borderRadius: "10px", padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <strong>{inv.event.name}</strong>
                    <span style={{ color: "#aaa", marginLeft: "0.8rem", fontSize: "0.85rem" }}>
                      {formatDate(inv.event.scheduled_at)} · by {inv.event.organizer.username}
                      {inv.event.location && ` · ${inv.event.location}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button onClick={() => handleRespond(inv.event.id, "accepted")} style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "none", background: "#2ecc71", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Accept</button>
                    <button onClick={() => handleRespond(inv.event.id, "declined")} style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid #555", background: "transparent", color: "#ccc", cursor: "pointer" }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0 }}>Events</h2>
          <button onClick={() => setShowCreate(true)} style={{ padding: "0.5rem 1.2rem", borderRadius: "6px", border: "none", background: "#e50914", color: "#fff", cursor: "pointer", fontWeight: 600 }}>+ Create Event</button>
        </div>

        {upcoming.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ color: "#aaa", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>Upcoming</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {upcoming.map((evt) => <EventCard key={evt.id} event={evt} onClick={() => navigate(`/events/${evt.id}`)} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h3 style={{ color: "#aaa", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>Past</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {past.map((evt) => <EventCard key={evt.id} event={evt} onClick={() => navigate(`/events/${evt.id}`)} />)}
            </div>
          </div>
        )}

        {events.length === 0 && invites.length === 0 && (
          <p style={{ color: "#666" }}>No events yet. Create one or wait for an invite!</p>
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

function EventCard({ event, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#1e1e1e", borderRadius: "10px", padding: "1.2rem", cursor: "pointer", borderLeft: "3px solid #e50914" }}>
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>{event.name}</h3>
      <p style={{ margin: 0, color: "#aaa", fontSize: "0.85rem" }}>{formatDate(event.scheduled_at)}</p>
      {event.location && <p style={{ margin: "0.2rem 0 0", color: "#888", fontSize: "0.82rem" }}>{event.location}</p>}
      <p style={{ margin: "0.4rem 0 0", color: "#666", fontSize: "0.8rem" }}>by {event.organizer.username}</p>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "No date set";
  return new Date(dt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

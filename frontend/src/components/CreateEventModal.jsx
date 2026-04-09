import { useState } from "react";
import { api } from "../api/client";

export default function CreateEventModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", scheduled_at: "", location: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.scheduled_at) { setError("Date is required"); return; }
    setSaving(true);
    try {
      const event = await api.createEvent({
        name: form.name.trim(),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        location: form.location.trim() || null,
      });
      onSaved(event);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "420px", color: "#fff" }}>
        <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem" }}>Create Movie Night</h2>
        {error && <p style={{ color: "#e50914", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <label style={labelStyle}>
            Name *
            <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Date & Time *
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Location
            <input value={form.location} onChange={(e) => set("location", e.target.value)} style={inputStyle} placeholder="Optional" />
          </label>
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.5rem 1.2rem", borderRadius: "6px", border: "1px solid #444", background: "transparent", color: "#fff", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: "0.5rem 1.2rem", borderRadius: "6px", border: "none", background: "#e50914", color: "#fff", cursor: "pointer", fontWeight: 600 }}>{saving ? "Creating…" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.9rem", color: "#aaa" };
const inputStyle = { padding: "0.5rem 0.7rem", borderRadius: "6px", border: "1px solid #444", background: "#111", color: "#fff", fontSize: "0.95rem" };

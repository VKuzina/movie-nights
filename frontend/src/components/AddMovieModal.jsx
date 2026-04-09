import { useState } from "react";
import { api } from "../api/client";

export default function AddMovieModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", year: "", genre: "", poster_url: "", imdb_url: "", description: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        year: form.year ? parseInt(form.year) : null,
        genre: form.genre.trim() || null,
        poster_url: form.poster_url.trim() || null,
        imdb_url: form.imdb_url.trim() || null,
        description: form.description.trim() || null,
      };
      const movie = await api.addMovie(payload);
      onSaved(movie);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem" }}>Add Movie</h2>
        {error && <p style={{ color: "#e50914", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <Field label="Title *" value={form.title} onChange={(v) => set("title", v)} />
          <Field label="Year" value={form.year} onChange={(v) => set("year", v)} type="number" />
          <Field label="Genre" value={form.genre} onChange={(v) => set("genre", v)} />
          <Field label="Poster URL" value={form.poster_url} onChange={(v) => set("poster_url", v)} />
          <Field label="IMDB URL" value={form.imdb_url} onChange={(v) => set("imdb_url", v)} />
          <Field label="Description" value={form.description} onChange={(v) => set("description", v)} />
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtn}>{saving ? "Saving…" : "Add Movie"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.9rem", color: "#aaa" }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "0.5rem 0.7rem", borderRadius: "6px", border: "1px solid #444", background: "#111", color: "#fff", fontSize: "0.95rem" }}
      />
    </label>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modal = { background: "#1a1a1a", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "480px", color: "#fff" };
const cancelBtn = { padding: "0.5rem 1.2rem", borderRadius: "6px", border: "1px solid #444", background: "transparent", color: "#fff", cursor: "pointer" };
const saveBtn = { padding: "0.5rem 1.2rem", borderRadius: "6px", border: "none", background: "#e50914", color: "#fff", cursor: "pointer", fontWeight: 600 };

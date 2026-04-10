import { useState } from "react";
import { api } from "../api/client";

const PREFS = ["want_to_watch", "can_watch_if_needed", "already_watched", "dont_watch_without_me", "dont_want_to_watch"];

export default function AddMovieModal({ onClose, onSaved }) {
  // "lookup" | "form"
  const [step, setStep] = useState("lookup");
  const [imdbInput, setImdbInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [form, setForm] = useState({ title: "", year: "", genre: "", poster_url: "", imdb_url: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLookup = async (e) => {
    e.preventDefault();
    const trimmed = imdbInput.trim();
    if (!trimmed) { setLookupError("Paste an IMDB link first"); return; }
    setLooking(true);
    setLookupError("");
    try {
      const data = await api.lookupMovie(trimmed);
      setForm({
        title: data.title || "",
        year: data.year ? String(data.year) : "",
        genre: data.genre || "",
        poster_url: data.poster_url || "",
        imdb_url: data.imdb_url || "",
        description: data.description || "",
      });
      setStep("form");
    } catch (err) {
      setLookupError(err.message || "Could not find movie");
    } finally {
      setLooking(false);
    }
  };

  const handleManual = () => {
    setForm({ title: "", year: "", genre: "", poster_url: "", imdb_url: "", description: "" });
    setStep("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setSaveError("Title is required"); return; }
    setSaving(true);
    setSaveError("");
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
      setSaveError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {step === "lookup" ? (
          <>
            <h2 style={heading}>Add a Movie</h2>
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
              Paste an IMDB link and we'll fill everything in for you.
            </p>
            <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <label style={labelStyle}>
                IMDB Link
                <input
                  type="url"
                  value={imdbInput}
                  onChange={(e) => setImdbInput(e.target.value)}
                  placeholder="https://www.imdb.com/title/tt0111161/"
                  autoFocus
                  style={inputStyle}
                />
              </label>
              {lookupError && <p style={errorStyle}>{lookupError}</p>}
              <button type="submit" disabled={looking} style={primaryBtn}>
                {looking ? "Looking up…" : "Look up movie"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
              <button onClick={handleManual} style={ghostBtn}>
                Add manually instead (no IMDB link)
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.4rem" }}>
              <button onClick={() => setStep("lookup")} style={backBtn}>← Back</button>
              <h2 style={{ ...heading, margin: 0 }}>
                {form.imdb_url ? "Confirm Details" : "Add Movie Manually"}
              </h2>
            </div>

            {form.poster_url && (
              <div style={{ display: "flex", gap: "1.2rem", marginBottom: "1.4rem", alignItems: "flex-start" }}>
                <img
                  src={form.poster_url}
                  alt={form.title}
                  referrerPolicy="no-referrer"
                  style={{ width: 80, borderRadius: 6, flexShrink: 0 }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <p style={{ color: "#aaa", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                  {form.description || ""}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <Field label="Title *" value={form.title} onChange={(v) => set("title", v)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <Field label="Year" value={form.year} onChange={(v) => set("year", v)} type="number" />
                <Field label="Genre" value={form.genre} onChange={(v) => set("genre", v)} />
              </div>
              <Field label="Poster URL" value={form.poster_url} onChange={(v) => set("poster_url", v)} />
              <Field label="IMDB URL" value={form.imdb_url} onChange={(v) => set("imdb_url", v)} />
              <label style={labelStyle}>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
              {saveError && <p style={errorStyle}>{saveError}</p>}
              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "0.4rem" }}>
                <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Saving…" : "Add Movie"}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label style={labelStyle}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
};
const modal = {
  background: "#1a1a1a", borderRadius: "14px", padding: "2rem",
  width: "100%", maxWidth: "500px", color: "#fff",
  maxHeight: "90vh", overflowY: "auto",
};
const heading = { margin: "0 0 0", fontSize: "1.2rem", fontWeight: 700 };
const labelStyle = { display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", color: "#aaa" };
const inputStyle = {
  padding: "0.5rem 0.7rem", borderRadius: "6px", border: "1px solid #444",
  background: "#111", color: "#fff", fontSize: "0.95rem",
};
const errorStyle = { color: "#e50914", fontSize: "0.85rem", margin: 0 };
const primaryBtn = {
  padding: "0.6rem 1.4rem", borderRadius: "8px", border: "none",
  background: "#e50914", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem",
};
const cancelBtn = {
  padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid #444",
  background: "transparent", color: "#ccc", cursor: "pointer",
};
const ghostBtn = {
  background: "none", border: "none", color: "#666", cursor: "pointer",
  fontSize: "0.85rem", textDecoration: "underline", padding: 0,
};
const backBtn = {
  background: "none", border: "none", color: "#888", cursor: "pointer",
  fontSize: "0.85rem", padding: 0, flexShrink: 0,
};

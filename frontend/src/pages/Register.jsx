import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.register(form.username, form.email, form.password);
      await api.login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-bg auth-container" style={styles.container}>
      <div className="fade-up auth-card" style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🎬</span>
          <h1 style={styles.title}>Movie Nights</h1>
        </div>
        <h2 style={styles.subtitle}>Create your account</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input style={styles.input} name="username" placeholder="pick a username" value={form.username} onChange={handleChange} required autoFocus />
          </label>
          <label style={styles.label}>
            Email
            <input style={styles.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </label>
          <label style={styles.label}>
            Password
            <input style={styles.input} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </label>
          <button className="btn-primary" style={styles.button} type="submit">Create account</button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  card: {
    background: "rgba(22,22,22,0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "360px",
    color: "#f0f0f0",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginBottom: "0.4rem",
  },
  logoIcon: { fontSize: "1.8rem" },
  title: { fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" },
  subtitle: { textAlign: "center", fontWeight: 400, color: "#666", fontSize: "0.95rem", marginBottom: "1.8rem" },
  errorBox: {
    background: "rgba(229,9,20,0.1)",
    border: "1px solid rgba(229,9,20,0.3)",
    borderRadius: "8px",
    padding: "0.6rem 0.9rem",
    color: "#e57070",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem", color: "#888", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" },
  input: {
    padding: "0.65rem 0.9rem",
    borderRadius: "8px",
    border: "1px solid #2a2a2a",
    background: "#111",
    color: "#f0f0f0",
    fontSize: "0.95rem",
    width: "100%",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    background: "#e50914",
    color: "#fff",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  footer: { marginTop: "1.5rem", textAlign: "center", color: "#555", fontSize: "0.85rem" },
  footerLink: { color: "#e57070", fontWeight: 600 },
};

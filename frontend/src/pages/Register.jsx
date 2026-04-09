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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Movie Nights</h1>
        <h2 style={styles.subtitle}>Create account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
          <input style={styles.input} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input style={styles.input} name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button style={styles.button} type="submit">Register</button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#111" },
  card: { background: "#1e1e1e", padding: "2rem", borderRadius: "12px", width: "340px", color: "#fff" },
  title: { margin: "0 0 0.25rem", fontSize: "1.8rem", textAlign: "center" },
  subtitle: { margin: "0 0 1.5rem", fontWeight: 400, textAlign: "center", color: "#aaa" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: { padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #333", background: "#2a2a2a", color: "#fff", fontSize: "1rem" },
  button: { padding: "0.7rem", borderRadius: "6px", border: "none", background: "#e50914", color: "#fff", fontSize: "1rem", cursor: "pointer" },
  error: { color: "#e50914", marginBottom: "0.5rem" },
  footer: { marginTop: "1rem", textAlign: "center", color: "#aaa", fontSize: "0.9rem" },
};

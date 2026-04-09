const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (username, email, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }),

  login: async (username, password) => {
    const form = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE}/auth/login`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
  },

  logout: () => localStorage.removeItem("token"),

  me: () => request("/auth/me"),

  listMovies: () => request("/movies"),

  addMovie: (movie) => request("/movies", { method: "POST", body: JSON.stringify(movie) }),

  likeMovie: (id) => request(`/movies/${id}/like`, { method: "POST" }),

  unlikeMovie: (id) => request(`/movies/${id}/like`, { method: "DELETE" }),

  myLikedMovies: () => request("/users/me/liked-movies"),
};

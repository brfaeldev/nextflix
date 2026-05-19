import { API_BASE_URL } from "../config.js";
import { getToken } from "./auth.js";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Erro na requisição.");
  }

  return data;
}

export function registerUser({ name, email, password }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchTrendingMovies() {
  return request("/movies/trending");
}

export function searchMovies(query) {
  const params = new URLSearchParams({ search: query, limit: "30" });
  return request(`/movies?${params}`);
}

export function fetchRecommendations() {
  return request("/recommendations");
}

export function likeMovie(movieId) {
  return request("/ratings", {
    method: "POST",
    body: JSON.stringify({ movieId, rating: 5 }),
  });
}

export function trackEvent({ movieId, eventType = "click", dwellSeconds = 0 }) {
  return request("/events", {
    method: "POST",
    body: JSON.stringify({ movieId, eventType, dwellSeconds }),
  });
}

export function triggerRetrain() {
  return request("/recommendations/retrain", { method: "POST" });
}

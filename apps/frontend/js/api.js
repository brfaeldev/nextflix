import { API_BASE_URL } from "./config.js";
import { getToken, logout } from "./auth.js";

const handleResponse = async (response, { redirectOn401 = false } = {}) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && redirectOn401 && getToken()) {
      logout();
      window.location.href = "./login.html";
    }

    throw new Error(data.error || "Erro na requisição");
  }

  return data;
};

export const apiFetch = async (path, options = {}, fetchOptions = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  return handleResponse(response, fetchOptions);
};

export const getMovies = (limit = 20) =>
  apiFetch(`/movies?limit=${limit}`);

export const getTrendingMovies = (limit = 12) =>
  apiFetch(`/movies/trending?limit=${limit}`);

export const searchMovies = (query, limit = 12) =>
  apiFetch(`/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getMovieById = (id) =>
  apiFetch(`/movies/${id}`);

export const getMovieDetails = (id) =>
  apiFetch(`/movies/${id}/details`);

export const getRecommendation = () =>
  apiFetch("/recommendation/me", {}, { redirectOn401: true });

export const getMyInteractions = () =>
  apiFetch("/interactions/me", {}, { redirectOn401: true });

export const rateMovie = (movieId, rating) =>
  apiFetch("/ratings", {
    method: "POST",
    body: JSON.stringify({ movie_id: movieId, rating })
  }, { redirectOn401: true });

export const getMyRating = (movieId) =>
  apiFetch(`/ratings/me/${movieId}`, {}, { redirectOn401: true });

export const getMyLikedMovies = () =>
  apiFetch("/ratings/me/likes", {}, { redirectOn401: true });

export const sendInteraction = (payload) =>
  apiFetch("/interactions", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const loginRequest = (email, password) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const registerRequest = (name, email, password) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });

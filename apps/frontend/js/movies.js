import { attachMovieTracking } from "./interactions.js";
import { navigateToMovie, normalizeMovieId } from "./navigation.js";

export const renderMovieCard = (movie, { navigate = true } = {}) => {
  const card = document.createElement("div");
  card.className = "movie-card";

  const movieId = normalizeMovieId(movie);

  const img = document.createElement("img");
  img.src = movie.poster;
  img.alt = movie.title;
  img.loading = "lazy";
  img.onerror = () => {
    img.src = `https://placehold.co/300x450/141414/e50914?text=${encodeURIComponent(movie.title.slice(0, 20))}`;
  };

  const title = document.createElement("p");
  title.textContent = movie.title;

  card.appendChild(img);
  card.appendChild(title);

  if (movieId) {
    attachMovieTracking(card, movieId);
  }

  if (navigate && movieId) {
    card.addEventListener("click", () => navigateToMovie(movieId));
  }

  return card;
};

export const renderMovieRow = (container, movies, options = {}) => {
  container.innerHTML = "";

  movies.forEach((movie) => {
    container.appendChild(renderMovieCard(movie, options));
  });
};

export const formatHistoryTitles = (historyMovies = []) =>
  historyMovies.map((movie) => movie.title).join(" → ");

export const truncate = (text, max = 120) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

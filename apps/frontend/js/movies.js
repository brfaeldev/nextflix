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

const scrollCarousel = (row, direction) => {
  const amount = Math.max(row.clientWidth * 0.85, 280);
  row.scrollBy({ left: direction * amount, behavior: "smooth" });
};

export const renderCarouselRow = (container, movies, options = {}) => {
  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "carousel-btn carousel-btn-prev";
  prevBtn.setAttribute("aria-label", "Ver anteriores");
  prevBtn.textContent = "‹";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "carousel-btn carousel-btn-next";
  nextBtn.setAttribute("aria-label", "Ver próximos");
  nextBtn.textContent = "›";

  const row = document.createElement("div");
  row.className = "movies-row";

  movies.forEach((movie) => {
    row.appendChild(renderMovieCard(movie, options));
  });

  prevBtn.addEventListener("click", () => scrollCarousel(row, -1));
  nextBtn.addEventListener("click", () => scrollCarousel(row, 1));

  container.appendChild(prevBtn);
  container.appendChild(row);
  container.appendChild(nextBtn);
};

export const formatHistoryTitles = (historyMovies = []) =>
  historyMovies.map((movie) => movie.title).join(" → ");

export const truncate = (text, max = 120) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

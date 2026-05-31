import {
  getMovieDetails,
  getMyRating,
  rateMovie
} from "../api.js";
import { getUser, isLoggedIn, logout } from "../auth.js";
import { trackClick } from "../interactions.js";
import { getMovieIdFromUrl } from "../navigation.js";
import { renderMovieRow } from "../movies.js";
import { initSearchBar } from "../search.js";

const REFRESH_FLAG = "nextflix_refresh_recommendation";

export const markRecommendationRefresh = () => {
  sessionStorage.setItem(REFRESH_FLAG, "1");
};

let currentMovieId = getMovieIdFromUrl();

const container = document.getElementById("movie-detail");
const profileBtn = document.getElementById("profile-btn");

if (isLoggedIn()) {
  const user = getUser();
  profileBtn.textContent = user?.name?.split(" ")[0] || "Perfil";
  profileBtn.addEventListener("click", () => {
    logout();
    window.location.href = "./login.html";
  });
} else {
  profileBtn.textContent = "Entrar";
  profileBtn.addEventListener("click", () => {
    window.location.href = "./login.html";
  });
}

initSearchBar();

const showError = (message) => {
  container.innerHTML = `
    <div class="movie-detail-error">
      <p>${message}</p>
      <a href="./home.html" class="back-link">← Voltar para início</a>
    </div>
  `;
};

const setRatingButtons = (currentRating) => {
  const likeBtn = document.getElementById("like-btn");
  const dislikeBtn = document.getElementById("dislike-btn");

  if (!likeBtn || !dislikeBtn) return;

  likeBtn.classList.toggle("is-active", currentRating === 1);
  dislikeBtn.classList.toggle("is-active", currentRating === -1);
};

const handleRating = async (rating) => {
  if (!isLoggedIn()) {
    window.location.href = "./login.html";
    return;
  }

  try {
    await rateMovie(currentMovieId, rating);
    setRatingButtons(rating);
    markRecommendationRefresh();

    const feedback = document.getElementById("rating-feedback");
    feedback.textContent =
      rating > 0
        ? "Curtida registrada — isso reforça suas recomendações."
        : "Dislike registrado — vamos evitar sugestões parecidas.";
  } catch (error) {
    const feedback = document.getElementById("rating-feedback");
    feedback.textContent = error.message;
  }
};

const renderMovie = (movie, currentRating = null) => {
  document.title = `${movie.title} | Nextflix`;

  container.innerHTML = `
    <section
      class="movie-detail-hero"
      style="background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.95)), url('${movie.backdrop || movie.poster}')"
    >
      <div class="movie-detail-content">
        <a href="./home.html" class="back-link" id="back-home">← Voltar</a>

        <img
          class="movie-detail-poster"
          src="${movie.poster}"
          alt="${movie.title}"
        >

        <div class="movie-detail-info">
          <h1>${movie.title}</h1>
          <p class="movie-detail-meta">${movie.year || "Ano desconhecido"} · ${movie.genre || "Filme"}</p>
          <p class="movie-detail-description">${movie.overview}</p>

          <div class="rating-actions">
            <button type="button" class="rating-btn like-btn" id="like-btn">👍 Gostei</button>
            <button type="button" class="rating-btn dislike-btn" id="dislike-btn">👎 Não gostei</button>
          </div>
          <p class="rating-feedback" id="rating-feedback"></p>

          <div class="hero-buttons">
            <button class="play-btn" type="button">▶ Assistir</button>
            <a href="./home.html" class="info-btn info-btn-link" id="back-recommendations">Ver recomendações</a>
          </div>
        </div>
      </div>
    </section>

    <section class="movie-category similar-section">
      <h3>Filmes parecidos</h3>
      <div class="movies-row" id="similar-row"></div>
    </section>
  `;

  document.getElementById("like-btn").addEventListener("click", () => handleRating(1));
  document.getElementById("dislike-btn").addEventListener("click", () => handleRating(-1));

  const markAndGoHome = (event) => {
    event.preventDefault();
    markRecommendationRefresh();
    window.location.href = "./home.html";
  };

  document.getElementById("back-home").addEventListener("click", markAndGoHome);
  document.getElementById("back-recommendations").addEventListener("click", markAndGoHome);

  if (movie.similar?.length) {
    renderMovieRow(document.getElementById("similar-row"), movie.similar);
  } else {
    document.querySelector(".similar-section").innerHTML =
      "<h3>Filmes parecidos</h3><p class='loading-text'>Nenhum título similar encontrado.</p>";
  }

  setRatingButtons(currentRating);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const loadMovie = async (id = getMovieIdFromUrl()) => {
  currentMovieId = id;

  if (!id) {
    showError("Filme não informado. Selecione um filme na home.");
    return;
  }

  container.innerHTML = '<p class="loading-text">Carregando filme...</p>';

  try {
    const movie = await getMovieDetails(id);
    let currentRating = null;

    if (isLoggedIn()) {
      try {
        const ratingData = await getMyRating(id);
        currentRating = ratingData.rating;
      } catch (error) {
        currentRating = null;
      }

      trackClick(id);
      markRecommendationRefresh();
    }

    renderMovie(movie, currentRating);
  } catch (error) {
    showError(error.message || "Não foi possível carregar este filme.");
  }
};

window.addEventListener("hashchange", () => {
  loadMovie(getMovieIdFromUrl());
});

loadMovie();

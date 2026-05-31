import { getMovieById } from "../api.js";
import { getUser, isLoggedIn, logout } from "../auth.js";
import { trackClick } from "../interactions.js";
import { getMovieIdFromUrl } from "../navigation.js";

const movieId = getMovieIdFromUrl();

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

const showError = (message) => {
  container.innerHTML = `
    <div class="movie-detail-error">
      <p>${message}</p>
      <a href="./home.html" class="back-link">← Voltar para início</a>
    </div>
  `;
};

const renderMovie = (movie) => {
  container.innerHTML = `
    <section
      class="movie-detail-hero"
      style="background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.95)), url('${movie.poster}')"
    >
      <div class="movie-detail-content">
        <a href="./home.html" class="back-link">← Voltar</a>

        <img
          class="movie-detail-poster"
          src="${movie.poster}"
          alt="${movie.title}"
        >

        <div class="movie-detail-info">
          <h1>${movie.title}</h1>
          <p class="movie-detail-meta">${movie.year || "Ano desconhecido"} · ${movie.genre || "Filme"}</p>
          <p class="movie-detail-description">
            Você está explorando um filme do catálogo MovieLens usado pelo modelo de recomendação NextFlix.
            Suas interações aqui ajudam a IA a entender suas preferências.
          </p>

          <div class="hero-buttons">
            <button class="play-btn" type="button">▶ Assistir</button>
            <a href="./home.html" class="info-btn info-btn-link">Ver recomendações</a>
          </div>
        </div>
      </div>
    </section>
  `;
};

const loadMovie = async () => {
  if (!movieId) {
    showError("Filme não informado. Selecione um filme na home.");
    return;
  }

  try {
    const movie = await getMovieById(movieId);
    renderMovie(movie);
    trackClick(movieId);
  } catch (error) {
    showError(error.message || "Não foi possível carregar este filme.");
  }
};

loadMovie();

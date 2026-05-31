import {
  getMovies,
  getTrendingMovies,
  getRecommendation
} from "../api.js";
import { getUser, logout, requireAuth } from "../auth.js";
import { formatHistoryTitles, renderMovieRow } from "../movies.js";
import { navigateToMovie, normalizeMovie } from "../navigation.js";

if (!requireAuth()) {
  throw new Error("Usuário não autenticado");
}

const user = getUser();

const profileBtn = document.querySelector(".profile-btn");
const heroTitle = document.getElementById("hero-title");
const heroDescription = document.getElementById("hero-description");
const heroPoster = document.getElementById("hero-banner");
const recommendationInfo = document.getElementById("recommendation-info");
const popularRow = document.getElementById("popular-row");
const trendingRow = document.getElementById("trending-row");
const recommendedRow = document.getElementById("recommended-row");
const refreshBtn = document.getElementById("refresh-recommendation");
const heroInfoBtn = document.querySelector(".info-btn");

let currentHeroMovie = null;
let lastRecommendedId = null;

profileBtn.textContent = user?.name?.split(" ")[0] || "Perfil";

profileBtn.addEventListener("click", () => {
  logout();
  window.location.href = "./login.html";
});

heroInfoBtn.addEventListener("click", () => {
  if (!currentHeroMovie) {
    recommendationInfo.textContent =
      "Aguarde o carregamento do filme em destaque.";
    return;
  }

  navigateToMovie(currentHeroMovie);
});

const formatTime = () =>
  new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

const setHero = (movie, subtitle = "") => {
  const normalized = normalizeMovie(movie);

  if (!normalized) return;

  currentHeroMovie = normalized;

  heroTitle.textContent = normalized.title;
  heroDescription.textContent =
    subtitle || `${normalized.year || ""} · ${normalized.genre || "Filme"}`;

  if (normalized.poster) {
    heroPoster.style.backgroundImage = `
      linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)),
      url('${normalized.poster}')
    `;
  }
};

const buildStatusMessage = (data, previousId) => {
  const time = formatTime();
  const movie = normalizeMovie(data.recommendedMovie);
  const historyLabel = data.historyMovies?.length
    ? formatHistoryTitles(data.historyMovies)
    : data.history?.join(" → ");

  if (data.source === "fallback") {
    return `${data.message} · verificado às ${time}`;
  }

  const changed = previousId && movie && previousId !== movie.id;
  const changeNote = changed
    ? "Nova sugestão encontrada."
    : "Mesma sugestão — clique em filmes diferentes para mudar o resultado.";

  return `Atualizado às ${time}. ${changeNote} Histórico usado: ${historyLabel}.`;
};

const loadRecommendation = async ({ fromRefresh = false } = {}) => {
  const previousId = lastRecommendedId;

  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Atualizando...";
    recommendedRow.classList.add("is-loading");
    recommendationInfo.textContent = fromRefresh
      ? "Consultando a IA com seu histórico recente..."
      : "Carregando recomendação personalizada...";

    const data = await getRecommendation();

    if (!data.recommendedMovie) {
      recommendationInfo.textContent =
        "Nenhuma recomendação disponível no momento.";
      return;
    }

    const movie = normalizeMovie(data.recommendedMovie);

    if (!movie) {
      recommendationInfo.textContent =
        "Recomendação inválida retornada pela API.";
      return;
    }

    const historyLabel = data.historyMovies?.length
      ? formatHistoryTitles(data.historyMovies)
      : data.history?.join(" → ");

    setHero(
      movie,
      data.source === "lstm"
        ? `Recomendado com base no seu histórico: ${historyLabel}`
        : data.message
    );

    recommendationInfo.textContent = buildStatusMessage(data, previousId);
    recommendationInfo.classList.add("is-updated");
    setTimeout(() => recommendationInfo.classList.remove("is-updated"), 1200);

    renderMovieRow(recommendedRow, [movie]);
    lastRecommendedId = movie.id;
  } catch (error) {
    recommendationInfo.textContent = `Recomendação indisponível: ${error.message}`;
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Atualizar recomendação";
    recommendedRow.classList.remove("is-loading");
  }
};

const loadCatalog = async () => {
  const [popular, trending] = await Promise.all([
    getMovies(12),
    getTrendingMovies(12)
  ]);

  renderMovieRow(popularRow, popular);
  renderMovieRow(trendingRow, trending);

  if (!currentHeroMovie) {
    setHero(trending[0] || popular[0]);
  }
};

refreshBtn.addEventListener("click", () =>
  loadRecommendation({ fromRefresh: true })
);

loadCatalog();
loadRecommendation();

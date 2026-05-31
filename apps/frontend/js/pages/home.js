import {
  getMovies,
  getTrendingMovies,
  getRecommendation,
  getMyInteractions
} from "../api.js";
import { getUser, logout, requireAuth } from "../auth.js";
import { formatHistoryTitles, renderMovieRow } from "../movies.js";
import { navigateToMovie, normalizeMovie } from "../navigation.js";
import { initSearchBar } from "../search.js";
import { handleCatalogHash, initMainNav } from "../navbar.js";

const REFRESH_FLAG = "nextflix_refresh_recommendation";

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

initSearchBar();
initMainNav("inicio");
handleCatalogHash();
window.addEventListener("hashchange", handleCatalogHash);

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
  let changeNote = changed
    ? "Nova sugestão encontrada."
    : "Mesma sugestão — interaja ou curta filmes diferentes para mudar o resultado.";

  if (data.likedCount > 0) {
    changeNote += ` Curtidas consideradas: ${data.likedCount}.`;
  }

  if (data.filterNote) {
    changeNote += ` ${data.filterNote}`;
  }

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
      data.source === "lstm" || data.source === "lstm_filtered"
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
  popularRow.innerHTML = "<p class='loading-text'>Carregando filmes...</p>";
  trendingRow.innerHTML = "<p class='loading-text'>Carregando filmes...</p>";

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

const showInteractionHint = async () => {
  try {
    const data = await getMyInteractions();

    if (data.history.length >= 3) return;

    recommendationInfo.textContent =
      `Você tem ${data.history.length} interação(ões). Faltam ${3 - data.history.length} para a IA personalizar totalmente — ou use 👍 Gostei nos filmes.`;
  } catch (error) {
    console.warn(error.message);
  }
};

refreshBtn.addEventListener("click", () =>
  loadRecommendation({ fromRefresh: true })
);

const bootstrap = async () => {
  await loadCatalog();

  const shouldRefresh = sessionStorage.getItem(REFRESH_FLAG) === "1";

  if (shouldRefresh) {
    sessionStorage.removeItem(REFRESH_FLAG);
    await loadRecommendation({ fromRefresh: true });
  } else {
    await loadRecommendation();
  }

  await showInteractionHint();
};

bootstrap();

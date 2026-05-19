import {
  fetchRecommendations,
  fetchTrendingMovies,
  searchMovies,
  triggerRetrain,
} from "../services/api.js";
import { clearSession, getUser, requireAuth } from "../services/auth.js";
import { createMovieCard } from "../components/movieCard.js";

if (!requireAuth()) {
  throw new Error("Não autenticado");
}

const heroSection = document.getElementById("home-hero");
const heroTitle = document.getElementById("hero-movie-title");
const heroDescription = document.getElementById("hero-movie-description");
const recRow = document.getElementById("rec-row");
const popularRow = document.getElementById("popular-row");
const searchRow = document.getElementById("search-row");
const recStatus = document.getElementById("rec-status");
const popularStatus = document.getElementById("popular-status");
const searchStatus = document.getElementById("search-status");
const searchForm = document.getElementById("search-form");
const logoutBtn = document.getElementById("logout-btn");
const retrainBtn = document.getElementById("retrain-btn");
const userGreeting = document.getElementById("user-greeting");

const user = getUser();
if (userGreeting && user) {
  userGreeting.textContent = `Olá, ${user.name}`;
}

function setStatus(element, message, type = "info") {
  if (!element) return;
  element.hidden = !message;
  element.textContent = message;
  element.className = `home-catalog__status message message--${type}`;
}

function fillRow(row, movies, showLike = true) {
  if (!row) return;
  row.replaceChildren();
  movies.forEach((movie) => {
    row.append(createMovieCard(movie, { showLike }));
  });
}

function updateHero(movie) {
  if (!movie) return;

  if (heroTitle) heroTitle.textContent = movie.title;
  if (heroDescription) {
    const genres = (movie.genres || []).join(", ");
    heroDescription.textContent = genres
      ? `Gêneros: ${genres}`
      : `Assista ${movie.title} agora no Nextflix.`;
  }

  if (heroSection && movie.poster) {
    heroSection.style.backgroundImage = `
      linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.85)),
      url("${movie.poster}")
    `;
  }
}

async function loadRecommendations() {
  setStatus(recStatus, "Carregando recomendações…", "info");

  try {
    const movies = await fetchRecommendations();
    setStatus(recStatus, "");
    fillRow(recRow, movies);
    if (movies[0]) updateHero(movies[0]);
  } catch (error) {
    setStatus(recStatus, error.message, "error");
  }
}

async function loadPopular() {
  setStatus(popularStatus, "Carregando…", "info");

  try {
    const movies = await fetchTrendingMovies();
    setStatus(popularStatus, "");
    fillRow(popularRow, movies);
    if (!recRow?.childElementCount && movies[0]) updateHero(movies[0]);
  } catch (error) {
    setStatus(popularStatus, error.message, "error");
  }
}

searchForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("search-input")?.value.trim();

  if (!query) {
    searchRow.replaceChildren();
    setStatus(searchStatus, "");
    return;
  }

  setStatus(searchStatus, "Buscando…", "info");

  try {
    const movies = await searchMovies(query);
    setStatus(searchStatus, movies.length ? "" : "Nenhum filme encontrado.", "info");
    fillRow(searchRow, movies);
  } catch (error) {
    setStatus(searchStatus, error.message, "error");
  }
});

logoutBtn?.addEventListener("click", () => {
  clearSession();
  window.location.href = "login.html";
});

retrainBtn?.addEventListener("click", async () => {
  retrainBtn.disabled = true;
  retrainBtn.textContent = "Atualizando…";

  try {
    await triggerRetrain();
    alert("Retreino iniciado. Aguarde alguns minutos e recarregue a página.");
  } catch (error) {
    alert(error.message);
  } finally {
    retrainBtn.disabled = false;
    retrainBtn.textContent = "Atualizar recomendações";
  }
});

loadRecommendations();
loadPopular();

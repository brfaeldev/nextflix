import { fetchTrendingMovies } from "../services/api.js";
import { createMovieCard } from "../components/movieCard.js";

const statusEl = document.getElementById("trending-status");
const rowEl = document.getElementById("trending-row");

function setStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.className = `landing-trending__status message message--${type}`;
}

async function loadTrending() {
  setStatus("Carregando filmes…", "info");

  try {
    const movies = await fetchTrendingMovies();
    setStatus("");
    rowEl.replaceChildren();
    movies.forEach((movie) => rowEl.append(createMovieCard(movie)));
  } catch {
    setStatus(
      "Não foi possível carregar os filmes. Verifique se a API está na porta 3000.",
      "error"
    );
  }
}

loadTrending();

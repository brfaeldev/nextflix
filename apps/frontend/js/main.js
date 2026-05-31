import { getTrendingMovies } from "./api.js";
import { renderMovieRow } from "./movies.js";
import { initSearchBar } from "./search.js";

initSearchBar();

const showError = (message) => {
  const container = document.getElementById("trending-preview");

  container.innerHTML = `
    <p class="form-error">${message}</p>
  `;
};

async function loadTrendingMovies() {
  const container = document.getElementById("trending-preview");

  container.innerHTML = `
    <h2>🔥 Em Alta</h2>
    <p class="loading-text">Carregando filmes...</p>
  `;

  try {
    const movies = await getTrendingMovies(10);

    container.innerHTML = `
      <h2>🔥 Em Alta</h2>
      <div class="movie-list"></div>
    `;

    renderMovieRow(container.querySelector(".movie-list"), movies);
  } catch (error) {
    showError(`Não foi possível carregar os filmes: ${error.message}`);
  }
}

loadTrendingMovies();

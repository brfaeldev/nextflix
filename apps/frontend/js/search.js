import { searchMovies } from "./api.js";
import { navigateToMovie } from "./navigation.js";

const debounce = (fn, delay = 300) => {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const renderResults = (container, movies) => {
  container.innerHTML = "";

  if (!movies.length) {
    container.innerHTML =
      '<p class="search-empty">Nenhum filme encontrado.</p>';
    container.hidden = false;
    return;
  }

  movies.forEach((movie) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result-item";
    button.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}">
      <span>${movie.title}</span>
    `;

    button.addEventListener("click", () => {
      container.hidden = true;
      navigateToMovie(movie.id);
    });

    container.appendChild(button);
  });

  container.hidden = false;
};

export const initSearchBar = () => {
  const input = document.getElementById("movie-search");
  const results = document.getElementById("search-results");

  if (!input || !results) return;

  const runSearch = debounce(async () => {
    const query = input.value.trim();

    if (query.length < 2) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    try {
      results.innerHTML = '<p class="search-empty">Buscando...</p>';
      results.hidden = false;

      const movies = await searchMovies(query);
      renderResults(results, movies);
    } catch (error) {
      results.innerHTML = `<p class="search-empty">${error.message}</p>`;
      results.hidden = false;
    }
  });

  input.addEventListener("input", runSearch);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".navbar-search") &&
      !event.target.closest("#landing-search-wrap")
    ) {
      results.hidden = true;
    }
  });
};

import { getMoviesByGenre } from "../api.js";
import { requireAuth } from "../auth.js";
import { renderCarouselRow } from "../movies.js";
import { initMainNav } from "../navbar.js";
import { initProfileMenu } from "../profile-menu.js";
import { initSearchBar } from "../search.js";

const GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Adventure"
];

const GENRE_LABELS = {
  Action: "Ação",
  Comedy: "Comédia",
  Drama: "Drama",
  Horror: "Terror",
  Romance: "Romance",
  "Sci-Fi": "Ficção científica",
  Thriller: "Suspense",
  Adventure: "Aventura"
};

if (!requireAuth()) {
  throw new Error("Usuário não autenticado");
}

const genreRows = document.getElementById("genre-rows");
const profileBtn = document.getElementById("profile-btn");

initSearchBar();
initMainNav("filmes");
initProfileMenu(profileBtn);

const loadGenreCatalog = async () => {
  genreRows.innerHTML = "<p class='loading-text'>Carregando catálogo...</p>";

  const sections = await Promise.all(
    GENRES.map(async (genre) => {
      try {
        const movies = await getMoviesByGenre(genre, 18);
        return { genre, movies };
      } catch {
        return { genre, movies: [] };
      }
    })
  );

  genreRows.innerHTML = "";

  sections.forEach(({ genre, movies }) => {
    if (!movies.length) return;

    const section = document.createElement("section");
    section.className = "movie-category";

    const title = document.createElement("h3");
    title.textContent = GENRE_LABELS[genre] || genre;
    section.appendChild(title);

    const carousel = document.createElement("div");
    carousel.className = "movie-carousel";
    section.appendChild(carousel);

    renderCarouselRow(carousel, movies);
    genreRows.appendChild(section);
  });

  if (!genreRows.children.length) {
    genreRows.innerHTML =
      "<p class='loading-text'>Nenhum filme encontrado no catálogo.</p>";
  }
};

loadGenreCatalog();

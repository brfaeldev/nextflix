import { getMyLikedMovies } from "../api.js";
import { requireAuth } from "../auth.js";
import { renderCarouselRow } from "../movies.js";
import { initMainNav } from "../navbar.js";
import { initProfileMenu } from "../profile-menu.js";
import { initSearchBar } from "../search.js";

if (!requireAuth()) {
  throw new Error("Usuário não autenticado");
}

const profileBtn = document.getElementById("profile-btn");
const listRow = document.getElementById("my-list-row");
const listEmpty = document.getElementById("list-empty");
const listSubtitle = document.getElementById("list-subtitle");

initMainNav("lista");
initSearchBar();
initProfileMenu(profileBtn);

const loadList = async () => {
  try {
    const data = await getMyLikedMovies();
    const movies = data.movies || [];

    if (!movies.length) {
      listEmpty.hidden = false;
      listSubtitle.textContent = "Nenhum filme curtido ainda.";
      return;
    }

    listSubtitle.textContent = `${movies.length} filme${movies.length === 1 ? "" : "s"} na sua lista`;
    const carousel = document.createElement("div");
    carousel.className = "movie-carousel";
    listRow.replaceWith(carousel);
    renderCarouselRow(carousel, movies);
  } catch (error) {
    listEmpty.hidden = false;
    listEmpty.textContent = error.message || "Não foi possível carregar sua lista.";
  }
};

loadList();

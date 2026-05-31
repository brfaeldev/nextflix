import { getMyLikedMovies } from "../api.js";
import { getUser, logout, requireAuth } from "../auth.js";
import { renderMovieRow } from "../movies.js";
import { initMainNav } from "../navbar.js";
import { initSearchBar } from "../search.js";

if (!requireAuth()) {
  throw new Error("Usuário não autenticado");
}

const user = getUser();
const profileBtn = document.getElementById("profile-btn");
const listRow = document.getElementById("my-list-row");
const listEmpty = document.getElementById("list-empty");
const listSubtitle = document.getElementById("list-subtitle");

initMainNav("lista");
initSearchBar();

profileBtn.textContent = user?.name?.split(" ")[0] || "Perfil";

profileBtn.addEventListener("click", () => {
  logout();
  window.location.href = "./login.html";
});

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
    renderMovieRow(listRow, movies);
  } catch (error) {
    listEmpty.hidden = false;
    listEmpty.textContent = error.message || "Não foi possível carregar sua lista.";
  }
};

loadList();

import { getUser, logout, requireAuth } from "../auth.js";
import { initMainNav } from "../navbar.js";
import { initSearchBar } from "../search.js";

if (!requireAuth()) {
  throw new Error("Usuário não autenticado");
}

const user = getUser();
const profileBtn = document.getElementById("profile-btn");

initMainNav("series");
initSearchBar();

profileBtn.textContent = user?.name?.split(" ")[0] || "Perfil";

profileBtn.addEventListener("click", () => {
  logout();
  window.location.href = "./login.html";
});

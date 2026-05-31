import { getUser, logout } from "./auth.js";

const closeAllMenus = () => {
  document.querySelectorAll(".profile-dropdown.is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    menu.hidden = true;
  });

  document.querySelectorAll(".profile-btn[aria-expanded='true']").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
};

export const initProfileMenu = (profileBtn, { loginHref = "./login.html" } = {}) => {
  if (!profileBtn) return;

  const user = getUser();
  profileBtn.textContent = user?.name?.split(" ")[0] || "Perfil";

  if (profileBtn.dataset.profileMenuInit === "1") {
    return;
  }

  profileBtn.dataset.profileMenuInit = "1";

  let wrap = profileBtn.closest(".profile-menu-wrap");

  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "profile-menu-wrap";
    profileBtn.parentNode.insertBefore(wrap, profileBtn);
    wrap.appendChild(profileBtn);
  }

  let dropdown = wrap.querySelector(".profile-dropdown");

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.className = "profile-dropdown";
    dropdown.hidden = true;
    dropdown.innerHTML = `
      <a class="profile-dropdown-item" href="./perfil.html">Configurações do perfil</a>
      <button type="button" class="profile-dropdown-item profile-dropdown-logout">Sair</button>
    `;
    wrap.appendChild(dropdown);

    dropdown.querySelector(".profile-dropdown-logout").addEventListener("click", () => {
      logout();
      window.location.href = loginHref;
    });
  }

  profileBtn.setAttribute("aria-haspopup", "true");
  profileBtn.setAttribute("aria-expanded", "false");

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = dropdown.classList.contains("is-open");

    closeAllMenus();

    if (!isOpen) {
      dropdown.hidden = false;
      dropdown.classList.add("is-open");
      profileBtn.setAttribute("aria-expanded", "true");
    }
  });

  if (!window.__nextflixProfileMenuBound) {
    window.__nextflixProfileMenuBound = true;

    document.addEventListener("click", closeAllMenus);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllMenus();
    });
  }
};

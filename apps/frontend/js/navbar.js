export const initMainNav = (activePage) => {
  document.querySelectorAll(".nav-links a[data-nav]").forEach((link) => {
    if (link.dataset.nav === activePage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
};

export const scrollToCatalog = () => {
  const section = document.getElementById("catalogo");

  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const handleCatalogHash = () => {
  if (window.location.hash !== "#catalogo") return;

  requestAnimationFrame(() => {
    scrollToCatalog();
  });
};

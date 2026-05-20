import { getToken } from "../services/auth.js";
import { likeMovie, trackEvent } from "../services/api.js";

/**
 * @param {object} movie
 * @param {{ showLike?: boolean, onInteract?: Function }} options
 */
export function createMovieCard(movie, options = {}) {
  const { showLike = false, onInteract } = options;

  const card = document.createElement("article");
  card.className = "movie-card";
  card.dataset.movieId = String(movie.id);

  const image = document.createElement("img");
  image.src = movie.poster;
  image.alt = `Capa do filme ${movie.title}`;
  image.loading = "lazy";

  const title = document.createElement("p");
  title.className = "movie-card__title";
  title.textContent = movie.year ? `${movie.title} (${movie.year})` : movie.title;

  card.append(image, title);

  if (showLike) {
    const likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = "movie-card__like btn btn--primary";
    likeBtn.textContent = "Curtir";
    likeBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        await likeMovie(movie.id);
        likeBtn.textContent = "Curtido";
        likeBtn.disabled = true;
        onInteract?.(movie, "like");
      } catch (error) {
        alert(error.message);
      }
    });
    card.append(likeBtn);
  }

  card.addEventListener("click", async () => {
    if (!getToken()) return;

    trackEvent({ movieId: movie.id, eventType: "click" }).catch(() => {});

    const openedAt = Date.now();
    const genres = (movie.genres || []).join(", ") || "—";
    alert(`${movie.title}\n\nGêneros: ${genres}`);
    const dwellSeconds = Math.round((Date.now() - openedAt) / 1000);
    trackEvent({ movieId: movie.id, eventType: "view", dwellSeconds }).catch(
      () => {}
    );
    onInteract?.(movie, "view");
  });

  return card;
}

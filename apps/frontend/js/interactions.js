import { sendInteraction } from "./api.js";
import { isLoggedIn } from "./auth.js";

const hoverTimers = new Map();

const canTrack = () => isLoggedIn();

export const trackClick = (movieId) => {
  if (!canTrack()) return;

  sendInteraction({
    movie_id: movieId,
    event_type: "click",
    duration: 0
  }).catch((err) => console.warn("Interação click:", err.message));
};

export const trackHoverStart = (movieId) => {
  if (!canTrack()) return;

  hoverTimers.set(movieId, Date.now());
};

export const trackHoverEnd = (movieId) => {
  if (!canTrack()) return;

  const startedAt = hoverTimers.get(movieId);

  if (!startedAt) return;

  hoverTimers.delete(movieId);

  const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  sendInteraction({
    movie_id: movieId,
    event_type: "hover",
    duration
  }).catch((err) => console.warn("Interação hover:", err.message));
};

export const attachMovieTracking = (card, movieId) => {
  if (!canTrack()) return;

  card.dataset.movieId = movieId;

  card.addEventListener("mouseenter", () => trackHoverStart(movieId));
  card.addEventListener("mouseleave", () => trackHoverEnd(movieId));
};

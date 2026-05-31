export const navigateToMovie = (movieOrId) => {
  const id =
    typeof movieOrId === "object"
      ? normalizeMovieId(movieOrId)
      : normalizeMovieId({ id: movieOrId });

  if (!id) {
    console.warn("Tentativa de abrir filme sem ID válido");
    return;
  }

  const onMoviePage = window.location.pathname.includes("movie.html");

  if (onMoviePage) {
    if (window.location.hash === `#${id}`) {
      return;
    }

    window.location.hash = String(id);
    return;
  }

  window.location.href = `movie.html#${id}`;
};

export const normalizeMovieId = (movie) => {
  const id = movie?.id ?? movie?.movieId;
  const parsed = Number(id);

  if (!id || Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const normalizeMovie = (movie) => {
  if (!movie) return null;

  const id = normalizeMovieId(movie);

  if (!id) return null;

  return { ...movie, id };
};

export const getMovieIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("id");
  const fromHash = window.location.hash.replace(/^#/, "");

  return normalizeMovieId({ id: fromQuery || fromHash });
};

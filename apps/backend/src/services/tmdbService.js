const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const cleanTitle = (title) =>
  title.replace(/\s*\(\d{4}\)\s*$/, "").trim();

const searchMovie = async (title, year) => {
  if (!TMDB_API_KEY) return null;

  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: cleanTitle(title),
    language: "pt-BR"
  });

  if (year) query.set("year", String(year));

  const response = await fetch(
    `${TMDB_BASE}/search/movie?${query.toString()}`
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.results?.[0] || null;
};

const getMovieDetailsFromTmdb = async (title, year) => {
  const match = await searchMovie(title, year);

  if (!match) {
    return {
      overview: null,
      backdrop: null
    };
  }

  return {
    overview: match.overview || null,
    backdrop: match.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${match.backdrop_path}`
      : null
  };
};

module.exports = {
  getMovieDetailsFromTmdb
};

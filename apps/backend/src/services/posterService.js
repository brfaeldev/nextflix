const db = require("../database/connection");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const cleanTitle = (title) =>
  title.replace(/\s*\(\d{4}\)\s*$/, "").trim();

const buildPlaceholderPoster = (title) => {
  const name = cleanTitle(title).slice(0, 28);
  const text = encodeURIComponent(name || "Filme");

  return `https://placehold.co/300x450/141414/e50914?text=${text}`;
};

const resolvePoster = (row) => {
  if (row.poster && !row.poster.includes("placehold.co")) {
    return row.poster;
  }

  return buildPlaceholderPoster(row.title);
};

const searchPoster = async (title, year) => {
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
  const match = data.results?.[0];

  if (!match?.poster_path) return null;

  return `https://image.tmdb.org/t/p/w500${match.poster_path}`;
};

const savePoster = (id, poster) =>
  new Promise((resolve, reject) => {
    db.run(
      "UPDATE movies SET poster = ? WHERE id = ?",
      [poster, id],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

const fetchAndSavePoster = async (movie) => {
  const poster = await searchPoster(movie.title, movie.year);

  if (!poster) return null;

  await savePoster(movie.id, poster);
  return poster;
};

const fetchPostersBatch = async (limit = 50) => {
  if (!TMDB_API_KEY) {
    console.log("TMDB_API_KEY não definida — usando placeholders");
    return 0;
  }

  const movies = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, year
       FROM movies
       WHERE poster IS NULL OR poster = '' OR poster LIKE '%placehold.co%'
       ORDER BY id ASC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });

  let updated = 0;

  for (const movie of movies) {
    try {
      const poster = await fetchAndSavePoster(movie);

      if (poster) {
        updated += 1;
        console.log(`Poster TMDB [${movie.id}] ${movie.title}`);
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (error) {
      console.warn(`Poster [${movie.id}]: ${error.message}`);
    }
  }

  return updated;
};

module.exports = {
  resolvePoster,
  fetchPostersBatch,
  fetchAndSavePoster
};

const db = require("../database/connection");
const { resolvePoster } = require("./posterService");
const { getMovieDetailsFromTmdb } = require("./tmdbService");

const GENRES = [
  "unknown", "Action", "Adventure", "Animation", "Children's",
  "Comedy", "Crime", "Documentary", "Drama", "Fantasy",
  "Film-Noir", "Horror", "Musical", "Mystery", "Romance",
  "Sci-Fi", "Thriller", "War", "Western"
];

const parseGenres = (genreStr) => {
  if (!genreStr) return "";
  return genreStr.split(",").filter(Boolean).join(", ");
};

const mapRow = (row) => ({
  id: row.id,
  title: row.title,
  year: row.year,
  genre: parseGenres(row.genre),
  poster: resolvePoster(row)
});

const getMovies = ({ limit = 20, offset = 0 } = {}) =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, year, genre, poster
       FROM movies
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(mapRow));
      }
    );
  });

const getTrendingMovies = (limit = 12) =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT m.id, m.title, m.year, m.genre, m.poster,
              COUNT(i.id) AS interaction_count
       FROM movies m
       LEFT JOIN interactions i ON i.movie_id = m.id
       GROUP BY m.id
       ORDER BY interaction_count DESC, m.id ASC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(mapRow));
      }
    );
  });

const getMovieById = (id) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT id, title, year, genre, poster
       FROM movies
       WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? mapRow(row) : null);
      }
    );
  });

const countMovies = () =>
  new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) AS total FROM movies", (err, row) => {
      if (err) return reject(err);
      resolve(row.total);
    });
  });

const getMoviesByGenre = (genre, limit = 20) =>
  new Promise((resolve, reject) => {
    const term = `%${genre.trim()}%`;

    db.all(
      `SELECT id, title, year, genre, poster
       FROM movies
       WHERE genre LIKE ?
       ORDER BY id ASC
       LIMIT ?`,
      [term, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(mapRow));
      }
    );
  });

const searchMovies = (query, limit = 12) =>
  new Promise((resolve, reject) => {
    const term = `%${query.trim()}%`;

    db.all(
      `SELECT id, title, year, genre, poster
       FROM movies
       WHERE title LIKE ?
       ORDER BY title ASC
       LIMIT ?`,
      [term, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(mapRow));
      }
    );
  });

const getSimilarMovies = (movieId, limit = 8) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT id, title, year, genre, poster
       FROM movies
       WHERE id = ?`,
      [movieId],
      (err, movie) => {
        if (err) return reject(err);
        if (!movie) return resolve([]);

        const primaryGenre = (movie.genre || "").split(",")[0]?.trim();

        if (!primaryGenre) {
          return resolve([]);
        }

        db.all(
          `SELECT id, title, year, genre, poster
           FROM movies
           WHERE id != ? AND genre LIKE ?
           ORDER BY id ASC
           LIMIT ?`,
          [movieId, `%${primaryGenre}%`, limit],
          (similarErr, rows) => {
            if (similarErr) return reject(similarErr);
            resolve(rows.map(mapRow));
          }
        );
      }
    );
  });

const getMovieDetails = async (id) => {
  const movie = await getMovieById(id);

  if (!movie) return null;

  const tmdb = await getMovieDetailsFromTmdb(movie.title, movie.year);
  const similar = await getSimilarMovies(id);

  return {
    ...movie,
    overview:
      tmdb.overview ||
      "Sinopse indisponível no momento. Este filme faz parte do catálogo MovieLens usado pelo modelo de recomendação NextFlix.",
    backdrop: tmdb.backdrop || movie.poster,
    similar
  };
};

module.exports = {
  GENRES,
  getMovies,
  getTrendingMovies,
  getMoviesByGenre,
  getMovieById,
  getSimilarMovies,
  getMovieDetails,
  searchMovies,
  countMovies
};

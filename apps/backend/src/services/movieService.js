const db = require("../database/connection");
const { resolvePoster } = require("./posterService");

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

module.exports = {
  GENRES,
  getMovies,
  getTrendingMovies,
  getMovieById,
  countMovies
};

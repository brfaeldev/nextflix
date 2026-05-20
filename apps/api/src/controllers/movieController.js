const { withDb, all, get } = require("../db/database");

const PLACEHOLDER_POSTER =
  "https://placehold.co/300x450/1a1a1a/666?text=Sem+Capa";

function mapMovie(row) {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    genres: row.genres ? row.genres.split("|") : [],
    poster: row.poster_url || PLACEHOLDER_POSTER,
  };
}

async function listMovies(req, res) {
  const search = (req.query.search || "").trim();
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  try {
    await withDb(async (db) => {
      let rows;
      if (search) {
        rows = await all(
          db,
          `SELECT id, title, year, genres, poster_url FROM movies
           WHERE title LIKE ? ORDER BY title LIMIT ?`,
          [`%${search}%`, limit]
        );
      } else {
        rows = await all(
          db,
          `SELECT id, title, year, genres, poster_url FROM movies
           ORDER BY title LIMIT ?`,
          [limit]
        );
      }
      res.json(rows.map(mapMovie));
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar filmes." });
  }
}

async function getMovieById(req, res) {
  const movieId = Number(req.params.id);

  try {
    await withDb(async (db) => {
      const row = await get(
        db,
        "SELECT id, title, year, genres, poster_url FROM movies WHERE id = ?",
        [movieId]
      );
      if (!row) {
        res.status(404).json({ error: "Filme não encontrado." });
        return;
      }
      res.json(mapMovie(row));
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar filme." });
  }
}

async function getTrendingMovies(req, res) {
  try {
    await withDb(async (db) => {
      const rows = await all(
        db,
        `SELECT m.id, m.title, m.year, m.genres, m.poster_url
         FROM movies m
         JOIN (
           SELECT movie_id, COUNT(*) AS total FROM ratings GROUP BY movie_id
           ORDER BY total DESC LIMIT 10
         ) popular ON popular.movie_id = m.id`
      );
      res.json(rows.map(mapMovie));
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar populares." });
  }
}

module.exports = { listMovies, getMovieById, getTrendingMovies, mapMovie };

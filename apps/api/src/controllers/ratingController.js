const { withDb, run } = require("../db/database");

async function createRating(req, res) {
  const { movieId, rating = 5 } = req.body;
  const userId = req.user.id;

  if (!movieId) {
    return res.status(400).json({ error: "movieId é obrigatório." });
  }

  const value = Number(rating);
  if (value < 1 || value > 5) {
    return res.status(400).json({ error: "Nota deve ser entre 1 e 5." });
  }

  const now = Math.floor(Date.now() / 1000);

  try {
    await withDb(async (db) => {
      await run(
        db,
        `INSERT INTO ratings (user_id, movie_id, rating, source, created_at)
         VALUES (?, ?, ?, 'app', ?)
         ON CONFLICT(user_id, movie_id) DO UPDATE SET
           rating = excluded.rating,
           source = 'app',
           created_at = excluded.created_at`,
        [userId, Number(movieId), value, now]
      );

      await run(
        db,
        `INSERT INTO events (user_id, movie_id, event_type, genre, dwell_seconds, created_at)
         VALUES (?, ?, 'like', NULL, 0, ?)`,
        [userId, Number(movieId), now]
      );

      res.status(201).json({ ok: true, movieId: Number(movieId), rating: value });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar avaliação." });
  }
}

module.exports = { createRating };

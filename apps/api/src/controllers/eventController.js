const { withDb, run, get } = require("../db/database");

async function createEvent(req, res) {
  const { movieId, eventType = "click", dwellSeconds = 0 } = req.body;
  const userId = req.user.id;

  if (!movieId) {
    return res.status(400).json({ error: "movieId é obrigatório." });
  }

  const now = Math.floor(Date.now() / 1000);

  try {
    await withDb(async (db) => {
      const movie = await get(db, "SELECT genres FROM movies WHERE id = ?", [
        Number(movieId),
      ]);
      const genre = movie?.genres?.split("|")[0] || null;

      await run(
        db,
        `INSERT INTO events (user_id, movie_id, event_type, genre, dwell_seconds, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          Number(movieId),
          eventType,
          genre,
          Number(dwellSeconds) || 0,
          now,
        ]
      );

      if (eventType === "click" || eventType === "view") {
        await run(
          db,
          `INSERT INTO ratings (user_id, movie_id, rating, source, created_at)
           VALUES (?, ?, 4, 'app', ?)
           ON CONFLICT(user_id, movie_id) DO NOTHING`,
          [userId, Number(movieId), now]
        );
      }

      res.status(201).json({ ok: true });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar evento." });
  }
}

module.exports = { createEvent };

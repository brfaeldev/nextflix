const { withDb, get } = require("../db/database");
const { mapMovie } = require("./movieController");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

async function getRecommendations(req, res) {
  const userId = req.user.id;

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, top_k: 10 }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data.movies || []);
    }
  } catch (error) {
    console.warn("ML service indisponível, usando cache/fallback:", error.message);
  }

  try {
    await withDb(async (db) => {
      const cached = await get(
        db,
        "SELECT movie_ids_json FROM recommendations_cache WHERE user_id = ?",
        [userId]
      );

      if (cached?.movie_ids_json) {
        const ids = JSON.parse(cached.movie_ids_json);
        const placeholders = ids.map(() => "?").join(",");
        const { all } = require("../db/database");
        const rows = await all(
          db,
          `SELECT id, title, year, genres, poster_url FROM movies
           WHERE id IN (${placeholders})`,
          ids
        );
        const byId = Object.fromEntries(rows.map((r) => [r.id, mapMovie(r)]));
        return res.json(ids.map((id) => byId[id]).filter(Boolean));
      }

      const { getTrendingMovies } = require("./movieController");
      req.query = {};
      return getTrendingMovies(req, res);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar recomendações." });
  }
}

async function triggerRetrain(req, res) {
  const { spawn } = require("child_process");
  const path = require("path");
  const script = path.join(__dirname, "../../../../ml/retrain_job.py");

  const child = spawn("python", [script], {
    cwd: path.join(__dirname, "../../../../"),
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  res.json({ ok: true, message: "Retreino iniciado em segundo plano." });
}

module.exports = { getRecommendations, triggerRetrain };

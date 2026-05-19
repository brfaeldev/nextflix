const fs = require("fs");
const path = require("path");
const { openDb, run } = require("./database");
const { SCHEMA_SQL } = require("./schema");

const MOVIELENS_DIR = path.join(
  __dirname,
  "../../../../data/movielens/ml-100k"
);

const GENRES = [
  "Unknown",
  "Action",
  "Adventure",
  "Animation",
  "Children",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Film-Noir",
  "Horror",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
];

function parseMovieLine(line) {
  const parts = line.split("|");
  if (parts.length < 24) return null;

  const id = Number(parts[0]);
  const title = parts[1].trim();
  const yearMatch = title.match(/\((\d{4})\)/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const flags = parts.slice(5, 24).map((v) => Number(v));
  const genres = GENRES.filter((_, index) => flags[index] === 1).join("|");

  return { id, title, year, genres };
}

async function seedMoviesFromMovieLens(db) {
  const itemPath = path.join(MOVIELENS_DIR, "u.item");
  if (!fs.existsSync(itemPath)) {
    console.warn("MovieLens u.item não encontrado. Rode: python ml/carregar_dados.py");
    return 0;
  }

  const lines = fs.readFileSync(itemPath, "latin1").split("\n");
  let count = 0;

  await run(db, "BEGIN TRANSACTION");
  try {
    for (const line of lines) {
      const movie = parseMovieLine(line.trim());
      if (!movie) continue;

      await run(
        db,
        `INSERT OR REPLACE INTO movies (id, title, year, genres, poster_url, tmdb_id)
         VALUES (?, ?, ?, ?, COALESCE((SELECT poster_url FROM movies WHERE id = ?), NULL), NULL)`,
        [movie.id, movie.title, movie.year, movie.genres, movie.id]
      );
      count += 1;
    }
    await run(db, "COMMIT");
  } catch (error) {
    await run(db, "ROLLBACK");
    throw error;
  }

  return count;
}

async function seedRatingsFromMovieLens(db) {
  const dataPath = path.join(MOVIELENS_DIR, "u.data");
  if (!fs.existsSync(dataPath)) return 0;

  const lines = fs.readFileSync(dataPath, "utf8").split("\n");
  let count = 0;

  await run(db, "BEGIN TRANSACTION");
  try {
    for (const line of lines) {
      if (!line.trim()) continue;
      const [userId, movieId, rating, timestamp] = line.split("\t");
      await run(
        db,
        `INSERT OR REPLACE INTO ratings (user_id, movie_id, rating, source, created_at)
         VALUES (?, ?, ?, 'movielens', ?)`,
        [Number(userId), Number(movieId), Number(rating), Number(timestamp)]
      );
      count += 1;
    }
    await run(db, "COMMIT");
  } catch (error) {
    await run(db, "ROLLBACK");
    throw error;
  }

  return count;
}

async function seedFallbackMovies(db) {
  const fallback = [
    { id: 1, title: "Matrix (1999)", year: 1999, genres: "Action|Sci-Fi" },
    { id: 2, title: "Interstellar (2014)", year: 2014, genres: "Sci-Fi|Drama" },
    { id: 3, title: "John Wick (2014)", year: 2014, genres: "Action|Thriller" },
  ];

  for (const movie of fallback) {
    await run(
      db,
      `INSERT OR IGNORE INTO movies (id, title, year, genres) VALUES (?, ?, ?, ?)`,
      [movie.id, movie.title, movie.year, movie.genres]
    );
  }
}

async function initDatabase({ seedMovieLens = true } = {}) {
  const db = openDb();
  try {
    await run(db, SCHEMA_SQL);

    const { get } = require("./database");
    const row = await get(db, "SELECT COUNT(*) AS total FROM movies");
    const hasMovies = row?.total > 0;

    if (seedMovieLens && !hasMovies) {
      const movies = await seedMoviesFromMovieLens(db);
      const ratings = await seedRatingsFromMovieLens(db);

      if (movies === 0) {
        await seedFallbackMovies(db);
        console.log("Catálogo fallback inserido (3 filmes).");
      } else {
        console.log(`Filmes importados: ${movies}`);
        console.log(`Avaliações MovieLens: ${ratings}`);
      }
    }
  } finally {
    await new Promise((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => console.log("Banco inicializado em apps/api/data/nextflix.db"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { initDatabase, MOVIELENS_DIR, GENRES };

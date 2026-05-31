require("dotenv").config();

const db = require("../src/database/connection");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const DELAY_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanTitle = (title) =>
  title.replace(/\s*\(\d{4}\)\s*$/, "").trim();

const searchPoster = async (title, year) => {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: cleanTitle(title),
    language: "pt-BR"
  });

  if (year) query.set("year", String(year));

  const response = await fetch(
    `${TMDB_BASE}/search/movie?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`TMDB respondeu ${response.status}`);
  }

  const data = await response.json();
  const match = data.results?.[0];

  if (!match?.poster_path) return null;

  return `https://image.tmdb.org/t/p/w500${match.poster_path}`;
};

const getMoviesWithoutPoster = () =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, year
       FROM movies
       WHERE poster IS NULL OR poster = ''
       ORDER BY id ASC`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });

const updatePoster = (id, poster) =>
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

const run = async () => {
  if (!TMDB_API_KEY) {
    console.error("Defina TMDB_API_KEY no arquivo .env");
    process.exit(1);
  }

  const movies = await getMoviesWithoutPoster();
  console.log(`Buscando posters para ${movies.length} filmes...`);

  let updated = 0;

  for (const movie of movies) {
    try {
      const poster = await searchPoster(movie.title, movie.year);

      if (poster) {
        await updatePoster(movie.id, poster);
        updated += 1;
        console.log(`✅ [${movie.id}] ${movie.title}`);
      } else {
        console.log(`⚠️  [${movie.id}] sem resultado — ${movie.title}`);
      }
    } catch (error) {
      console.log(`❌ [${movie.id}] ${error.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nConcluído: ${updated}/${movies.length} posters atualizados`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

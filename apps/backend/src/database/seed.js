const fs = require("fs");
const path = require("path");
const db = require("./connection");
const { countMovies, GENRES } = require("../services/movieService");

const ITEM_PATH = path.join(
  __dirname,
  "../ml/data/raw/ml-100k/u.item"
);

const parseMovieLine = (line) => {
  const parts = line.split("|");
  const id = Number(parts[0]);
  const title = parts[1];
  const yearMatch = title.match(/\((\d{4})\)$/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  const genreFlags = parts.slice(5, 5 + GENRES.length);
  const genre = genreFlags
    .map((flag, index) => (Number(flag) === 1 ? GENRES[index] : null))
    .filter((g) => g && g !== "unknown")
    .join(",");

  return { id, title, year, genre };
};

const seedMoviesIfEmpty = async () => {
  const total = await countMovies();

  if (total > 0) {
    console.log(`Catálogo OK (${total} filmes)`);
    return;
  }

  if (!fs.existsSync(ITEM_PATH)) {
    console.warn("Arquivo u.item não encontrado — rode npm run seed");
    return;
  }

  const content = fs.readFileSync(ITEM_PATH, "latin1");
  const movies = content
    .split("\n")
    .filter(Boolean)
    .map(parseMovieLine);

  await new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO movies (id, title, genre, year, poster)
        VALUES (?, ?, ?, ?, NULL)
      `);

      for (const movie of movies) {
        stmt.run(movie.id, movie.title, movie.genre, movie.year);
      }

      stmt.finalize((err) => {
        if (err) return reject(err);
        console.log(`✅ ${movies.length} filmes importados do MovieLens`);
        resolve();
      });
    });
  });
};

module.exports = { seedMoviesIfEmpty };

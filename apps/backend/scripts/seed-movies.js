const fs = require("fs");
const path = require("path");
const db = require("../src/database/connection");

const ITEM_PATH = path.join(
  __dirname,
  "../src/ml/data/raw/ml-100k/u.item"
);

const GENRES = [
  "unknown", "Action", "Adventure", "Animation", "Children's",
  "Comedy", "Crime", "Documentary", "Drama", "Fantasy",
  "Film-Noir", "Horror", "Musical", "Mystery", "Romance",
  "Sci-Fi", "Thriller", "War", "Western"
];

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

const seedMovies = () =>
  new Promise((resolve, reject) => {
    const content = fs.readFileSync(ITEM_PATH, "latin1");
    const movies = content
      .split("\n")
      .filter(Boolean)
      .map(parseMovieLine);

    db.serialize(() => {
      db.run("DELETE FROM movies");

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
        resolve(movies.length);
      });
    });
  });

seedMovies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erro ao popular filmes:", err.message);
    process.exit(1);
  });

const db = require("../database/connection");
const { saveInteraction } = require("./interactionService");
const { resolvePoster } = require("./posterService");

const mapMovieRow = (row) => ({
  id: row.id,
  title: row.title,
  year: row.year,
  genre: (row.genre || "").split(",").filter(Boolean).join(", "),
  poster: resolvePoster(row)
});

const getUserRatings = (userId) =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT movie_id, rating
       FROM ratings
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });

const getUserLikes = async (userId) => {
  const ratings = await getUserRatings(userId);
  return ratings.filter((row) => row.rating > 0).map((row) => row.movie_id);
};

const getUserLikedMovies = (userId) =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT m.id, m.title, m.year, m.genre, m.poster
       FROM ratings r
       INNER JOIN movies m ON m.id = r.movie_id
       WHERE r.user_id = ? AND r.rating > 0
       ORDER BY r.id DESC`,
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(mapMovieRow));
      }
    );
  });

const getUserDislikes = async (userId) => {
  const ratings = await getUserRatings(userId);
  return ratings.filter((row) => row.rating < 0).map((row) => row.movie_id);
};

const getUserRatingForMovie = (userId, movieId) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT rating
       FROM ratings
       WHERE user_id = ? AND movie_id = ?`,
      [userId, movieId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.rating : null);
      }
    );
  });

const saveRating = ({ user_id, movie_id, rating }) =>
  new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM ratings WHERE user_id = ? AND movie_id = ?`,
      [user_id, movie_id],
      (deleteErr) => {
        if (deleteErr) return reject(deleteErr);

        db.run(
          `INSERT INTO ratings (user_id, movie_id, rating)
           VALUES (?, ?, ?)`,
          [user_id, movie_id, rating],
          async function (insertErr) {
            if (insertErr) return reject(insertErr);

            if (rating > 0) {
              try {
                await saveInteraction({
                  user_id,
                  movie_id,
                  event_type: "like",
                  duration: 0
                });
              } catch (interactionErr) {
                return reject(interactionErr);
              }
            }

            resolve({
              id: this.lastID,
              user_id,
              movie_id,
              rating
            });
          }
        );
      }
    );
  });

const removeRating = (userId, movieId) =>
  new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM ratings WHERE user_id = ? AND movie_id = ?`,
      [userId, movieId],
      function (err) {
        if (err) return reject(err);
        resolve({ removed: this.changes > 0 });
      }
    );
  });

module.exports = {
  getUserRatings,
  getUserLikes,
  getUserLikedMovies,
  getUserDislikes,
  getUserRatingForMovie,
  saveRating,
  removeRating
};

const db = require("../database/connection");

const saveInteraction = ({
  user_id,
  movie_id,
  event_type,
  duration
}) =>
  new Promise((resolve, reject) => {
    const query = `
      INSERT INTO interactions (
        user_id,
        movie_id,
        event_type,
        duration
      )
      VALUES (?, ?, ?, ?)
    `;

    db.run(
      query,
      [user_id, movie_id, event_type, duration || 0],
      function (err) {
        if (err) return reject(err);

        resolve({
          id: this.lastID,
          user_id,
          movie_id,
          event_type,
          duration: duration || 0
        });
      }
    );
  });

const getUserHistory = (userId) =>
  new Promise((resolve, reject) => {
    const query = `
      SELECT movie_id
      FROM interactions
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 20
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((row) => row.movie_id));
    });
  });

module.exports = {
  saveInteraction,
  getUserHistory
};

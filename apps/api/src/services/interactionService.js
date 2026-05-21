const db = require("../database/connection");

const saveInteraction = (interaction, callback) => {

  const {
    user_id,
    movie_id,
    event_type,
    duration
  } = interaction;

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
    [user_id, movie_id, event_type, duration],
    function(err) {

      if (err) {
        callback(err);
      } else {
        callback(null, {
          id: this.lastID,
          ...interaction
        });
      }
    }
  );
};

const getUserInteractions = (userId, callback) => {

  const query = `
    SELECT *
    FROM interactions
    WHERE user_id = ?
    ORDER BY timestamp ASC
  `;

  db.all(query, [userId], (err, rows) => {

    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};

module.exports = {
  saveInteraction,
  getUserInteractions
};
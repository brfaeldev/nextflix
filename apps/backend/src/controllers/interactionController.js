const {
  saveInteraction,
  getUserHistory
} = require("../services/interactionService");
const { getMovieById } = require("../services/movieService");

const buildHistoryMovies = async (ids) => {
  const movies = await Promise.all(
    ids.map((id) => getMovieById(id))
  );

  return movies
    .filter(Boolean)
    .map((movie) => ({
      id: movie.id,
      title: movie.title
    }));
};

const createInteraction = async (req, res) => {
  try {
    const { movie_id, event_type, duration } = req.body;

    if (!movie_id || !event_type) {
      return res.status(400).json({
        error: "movie_id e event_type são obrigatórios"
      });
    }

    const interaction = await saveInteraction({
      user_id: req.user.id,
      movie_id,
      event_type,
      duration
    });

    res.status(201).json({
      message: "Interação salva",
      interaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInteractionsByUser = async (req, res) => {
  try {
    const history = await getUserHistory(req.user.id);
    const historyMovies = await buildHistoryMovies(history);

    res.json({
      userId: req.user.id,
      history,
      historyMovies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createInteraction,
  getInteractionsByUser
};

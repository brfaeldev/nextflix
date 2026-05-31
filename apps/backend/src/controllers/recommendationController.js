const { getRecommendation } = require("../services/recommendationService");
const { getUserHistory } = require("../services/interactionService");
const { getTrendingMovies, getMovieById } = require("../services/movieService");
const { getRecentSequenceForLstm } = require("../utils/historyUtils");
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

const recommendMovie = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getUserHistory(userId);
    const historyMovies = await buildHistoryMovies(history);

    if (history.length < 3) {
      const fallback = await getTrendingMovies(1);

      return res.json({
        userId,
        history,
        historyMovies,
        source: "fallback",
        updatedAt: new Date().toISOString(),
        message: `Interaja com mais ${3 - history.length} filme(s) para desbloquear recomendação personalizada.`,
        recommendedMovie: fallback[0] || null
      });    }

    const recentHistory = getRecentSequenceForLstm(history);
    const recentHistoryMovies = await buildHistoryMovies(recentHistory);

    getRecommendation(recentHistory, async (err, result) => {      if (err) {
        return res.status(500).json({ error: err.message });
      }

      try {
        const cleanResult = result.trim();
        const [movieId, title] = cleanResult.split("|");
        const movieDetails = await getMovieById(Number(movieId));

        res.json({
          userId,
          history: recentHistory,
          historyMovies: recentHistoryMovies,
          source: "lstm",
          updatedAt: new Date().toISOString(),
          recommendedMovie: movieDetails || {            id: Number(movieId),
            title,
            poster: null,
            year: null,
            genre: null
          }
        });
      } catch (innerError) {
        res.status(500).json({ error: innerError.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  recommendMovie
};

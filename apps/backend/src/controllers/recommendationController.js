const { getRecommendation } = require("../services/recommendationService");
const { getUserHistory } = require("../services/interactionService");
const {
  getTrendingMovies,
  getMovieById,
  getSimilarMovies
} = require("../services/movieService");
const {
  getUserLikes,
  getUserDislikes
} = require("../services/ratingService");
const { buildSequenceWithRatings } = require("../utils/historyUtils");

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

const pickAlternativeMovie = async (dislikedIds, referenceMovieId) => {
  const similar = await getSimilarMovies(referenceMovieId, 12);
  const alternative = similar.find((movie) => !dislikedIds.includes(movie.id));

  if (alternative) return alternative;

  const trending = await getTrendingMovies(10);
  return trending.find((movie) => !dislikedIds.includes(movie.id)) || null;
};

const recommendMovie = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getUserHistory(userId);
    const likedIds = await getUserLikes(userId);
    const dislikedIds = await getUserDislikes(userId);
    const historyMovies = await buildHistoryMovies(history);

    const recentHistory = buildSequenceWithRatings(history, likedIds);

    if (recentHistory.length < 3) {
      const fallback = await getTrendingMovies(1);

      return res.json({
        userId,
        history,
        historyMovies,
        likedCount: likedIds.length,
        source: "fallback",
        updatedAt: new Date().toISOString(),
        message: `Faltam ${3 - recentHistory.length} interação(ões) ou curtidas para desbloquear a IA personalizada.`,
        recommendedMovie: fallback[0] || null
      });
    }

    const recentHistoryMovies = await buildHistoryMovies(recentHistory);

    getRecommendation(recentHistory, async (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      try {
        const cleanResult = result.trim();
        const [movieId, title] = cleanResult.split("|");
        let movieDetails = await getMovieById(Number(movieId));
        let source = "lstm";
        let filterNote = null;

        if (movieDetails && dislikedIds.includes(movieDetails.id)) {
          const alternative = await pickAlternativeMovie(
            dislikedIds,
            movieDetails.id
          );

          if (alternative) {
            movieDetails = alternative;
            source = "lstm_filtered";
            filterNote =
              "Substituímos um filme que você marcou como dislike por uma opção parecida.";
          }
        }

        res.json({
          userId,
          history: recentHistory,
          historyMovies: recentHistoryMovies,
          likedCount: likedIds.length,
          source,
          filterNote,
          updatedAt: new Date().toISOString(),
          recommendedMovie: movieDetails || {
            id: Number(movieId),
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

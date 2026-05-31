const {
  getUserRatings,
  getUserLikedMovies,
  getUserRatingForMovie,
  saveRating,
  removeRating
} = require("../services/ratingService");

const rateMovie = async (req, res) => {
  try {
    const { movie_id, rating } = req.body;

    if (!movie_id || rating === undefined) {
      return res.status(400).json({
        error: "movie_id e rating são obrigatórios"
      });
    }

    if (rating !== 1 && rating !== -1) {
      return res.status(400).json({
        error: "rating deve ser 1 (gostei) ou -1 (não gostei)"
      });
    }

    const saved = await saveRating({
      user_id: req.user.id,
      movie_id,
      rating
    });

    res.status(201).json({
      message: rating > 0 ? "Filme curtido" : "Filme marcado como dislike",
      rating: saved
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const clearRating = async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    await removeRating(req.user.id, movieId);

    res.json({ message: "Avaliação removida" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const myRatings = async (req, res) => {
  try {
    const ratings = await getUserRatings(req.user.id);

    res.json({
      userId: req.user.id,
      ratings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const myLikedMovies = async (req, res) => {
  try {
    const movies = await getUserLikedMovies(req.user.id);

    res.json({
      userId: req.user.id,
      movies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const myRatingForMovie = async (req, res) => {
  try {
    const rating = await getUserRatingForMovie(
      req.user.id,
      req.params.movieId
    );

    res.json({
      movieId: Number(req.params.movieId),
      rating
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  rateMovie,
  clearRating,
  myRatings,
  myLikedMovies,
  myRatingForMovie
};

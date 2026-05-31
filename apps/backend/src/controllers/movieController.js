const {
  getMovies,
  getTrendingMovies,
  getMovieById
} = require("../services/movieService");

const listMovies = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const movies = await getMovies({ limit, offset });

    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const trendingMovies = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 12;
    const movies = await getTrendingMovies(limit);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const showMovie = async (req, res) => {
  try {
    const movie = await getMovieById(req.params.id);

    if (!movie) {
      return res.status(404).json({ error: "Filme não encontrado" });
    }

    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listMovies,
  trendingMovies,
  showMovie
};

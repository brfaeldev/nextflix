const express = require("express");
const {
  listMovies,
  getMovieById,
  getTrendingMovies,
} = require("../controllers/movieController");

const router = express.Router();

router.get("/trending", getTrendingMovies);
router.get("/:id", getMovieById);
router.get("/", listMovies);

module.exports = router;

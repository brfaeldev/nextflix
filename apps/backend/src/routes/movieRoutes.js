const express = require("express");
const router = express.Router();

const {
  listMovies,
  trendingMovies,
  showMovie,
  showMovieDetails,
  search
} = require("../controllers/movieController");

router.get("/", listMovies);
router.get("/trending", trendingMovies);
router.get("/search", search);
router.get("/:id/details", showMovieDetails);
router.get("/:id", showMovie);

module.exports = router;

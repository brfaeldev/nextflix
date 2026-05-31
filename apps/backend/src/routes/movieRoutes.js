const express = require("express");
const router = express.Router();

const {
  listMovies,
  trendingMovies,
  showMovie
} = require("../controllers/movieController");

router.get("/", listMovies);
router.get("/trending", trendingMovies);
router.get("/:id", showMovie);

module.exports = router;

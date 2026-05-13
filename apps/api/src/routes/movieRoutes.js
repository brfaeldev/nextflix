const express = require("express");
const router = express.Router();

const {
  getTrendingMovies
} = require("../controllers/movieController");

router.get("/trending", getTrendingMovies);

module.exports = router;
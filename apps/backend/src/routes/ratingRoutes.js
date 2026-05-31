const express = require("express");
const router = express.Router();

const {
  rateMovie,
  clearRating,
  myRatings,
  myLikedMovies,
  myRatingForMovie
} = require("../controllers/ratingController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, rateMovie);
router.get("/me", authMiddleware, myRatings);
router.get("/me/likes", authMiddleware, myLikedMovies);
router.get("/me/:movieId", authMiddleware, myRatingForMovie);
router.delete("/:movieId", authMiddleware, clearRating);

module.exports = router;

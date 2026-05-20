const express = require("express");
const { authRequired } = require("../middleware/auth");
const { createRating } = require("../controllers/ratingController");

const router = express.Router();

router.post("/", authRequired, createRating);

module.exports = router;

const express = require("express");
const router = express.Router();

const { recommendMovie } = require("../controllers/recommendationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, recommendMovie);

module.exports = router;

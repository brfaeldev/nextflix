const express = require("express");
const router = express.Router();

const {
  createInteraction,
  getInteractionsByUser
} = require("../controllers/interactionController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createInteraction);
router.get("/me", authMiddleware, getInteractionsByUser);

module.exports = router;

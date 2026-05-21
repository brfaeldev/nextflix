const express = require("express");
const router = express.Router();

const {
  createInteraction,
  getInteractionsByUser
} = require("../controllers/interactionController");

router.post("/", createInteraction);
router.get("/:userId", getInteractionsByUser);

module.exports = router;
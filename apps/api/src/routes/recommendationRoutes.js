const express = require("express");
const { authRequired } = require("../middleware/auth");
const {
  getRecommendations,
  triggerRetrain,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/", authRequired, getRecommendations);
router.post("/retrain", authRequired, triggerRetrain);

module.exports = router;

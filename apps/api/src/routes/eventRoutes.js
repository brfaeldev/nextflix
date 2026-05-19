const express = require("express");
const { authRequired } = require("../middleware/auth");
const { createEvent } = require("../controllers/eventController");

const router = express.Router();

router.post("/", authRequired, createEvent);

module.exports = router;

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const {
    getLeaderboard
} = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/", authenticate, getLeaderboard);

module.exports = router;

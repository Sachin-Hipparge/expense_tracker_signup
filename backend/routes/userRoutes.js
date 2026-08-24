const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const {
    signup,
    login,
    getPremiumStatus
} = require("../controllers/userController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/premium-status", authenticate, getPremiumStatus);

module.exports = router;

const express = require("express");

const {
    forgotPassword
} = require("../controllers/passwordController");

const router = express.Router();

router.post(
    "/forgotpassword",
    forgotPassword
);

module.exports = router;
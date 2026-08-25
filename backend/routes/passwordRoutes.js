const express = require("express");

const {
    forgotPassword,
    showResetPasswordPage,
    resetPassword
} = require("../controllers/passwordController");

const router = express.Router();


// Send reset email

router.post(
    "/forgotpassword",
    forgotPassword
);


// Open reset password page

router.get(
    "/resetpassword/:id",
    showResetPasswordPage
);


// Submit new password

router.post(
    "/resetpassword/:id",
    resetPassword
);


module.exports = router;
const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const {
    purchasePremium,
    verifyPayment
} = require("../controllers/paymentController");

const router = express.Router();

router.get("/purchase-premium", authenticate, purchasePremium);
router.get("/verify-payment/:orderId", authenticate, verifyPayment);

module.exports = router;

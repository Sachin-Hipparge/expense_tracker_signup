const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const {
    addExpense,
    getExpenses,
    deleteExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.post("/add", authenticate, addExpense);
router.get("/all", authenticate, getExpenses);
router.delete("/delete/:id", authenticate, deleteExpense);

module.exports = router;

const express = require("express");

const db = require("../utils/database");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== ADD EXPENSE ====================

router.post("/add", authenticate, (req, res) => {

    const { amount, description, category } = req.body;

    const userId = req.userId;


    const sql = `
        INSERT INTO expenses
        (amount, description, category, userId)
        VALUES (?, ?, ?, ?)
    `;


    db.execute(
        sql,
        [amount, description, category, userId],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Failed to add expense"
                });

            }


            res.status(201).json({
                message: "Expense added successfully"
            });

        }
    );

});


// ==================== GET EXPENSES ====================

router.get("/all", authenticate, (req, res) => {

    const userId = req.userId;


    const sql = `
        SELECT *
        FROM expenses
        WHERE userId = ?
        ORDER BY id DESC
    `;


    db.execute(sql, [userId], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Failed to fetch expenses"
            });

        }


        res.status(200).json(results);

    });

});


// ==================== DELETE EXPENSE ====================

router.delete("/delete/:id", authenticate, (req, res) => {

    const expenseId = req.params.id;

    const userId = req.userId;


    const sql = `
        DELETE FROM expenses
        WHERE id = ? AND userId = ?
    `;


    db.execute(
        sql,
        [expenseId, userId],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Failed to delete expense"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(403).json({
                    message: "You cannot delete this expense"
                });

            }


            res.status(200).json({
                message: "Expense deleted successfully"
            });

        }
    );

});


module.exports = router;
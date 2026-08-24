const express = require("express");

const db = require("../utils/database");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== ADD EXPENSE ====================

router.post("/add", authenticate, (req, res) => {

    const { amount, description, category } = req.body;

    const userId = req.userId;


    // 1. Add expense to expenses table

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


            // 2. Update user's totalExpense

            const updateTotalExpense = `
                UPDATE users
                SET totalExpense = totalExpense + ?
                WHERE id = ?
            `;


            db.execute(
                updateTotalExpense,
                [amount, userId],
                (err) => {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            message: "Expense added but total expense update failed"
                        });

                    }


                    // 3. Everything successful

                    res.status(201).json({
                        message: "Expense added successfully"
                    });

                }
            );

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


    // 1. First get the expense amount

    const getExpense = `
        SELECT amount
        FROM expenses
        WHERE id = ? AND userId = ?
    `;


    db.execute(
        getExpense,
        [expenseId, userId],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Failed to find expense"
                });

            }


            if (results.length === 0) {

                return res.status(403).json({
                    message: "You cannot delete this expense"
                });

            }


            const amount = results[0].amount;


            // 2. Delete the expense

            const deleteExpense = `
                DELETE FROM expenses
                WHERE id = ? AND userId = ?
            `;


            db.execute(
                deleteExpense,
                [expenseId, userId],
                (err, result) => {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            message: "Failed to delete expense"
                        });

                    }


                    // 3. Reduce totalExpense

                    const updateTotalExpense = `
                        UPDATE users
                        SET totalExpense = totalExpense - ?
                        WHERE id = ?
                    `;


                    db.execute(
                        updateTotalExpense,
                        [amount, userId],
                        (err) => {

                            if (err) {

                                console.log(err);

                                return res.status(500).json({
                                    message: "Expense deleted but total expense update failed"
                                });

                            }


                            // 4. Everything successful

                            res.status(200).json({
                                message: "Expense deleted successfully"
                            });

                        }
                    );

                }
            );

        }
    );

});

module.exports = router;
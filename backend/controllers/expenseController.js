const db = require("../utils/database");

function addExpense(req, res) {
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
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Failed to add expense"
                });
            }

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

                    res.status(201).json({
                        message: "Expense added successfully"
                    });
                }
            );
        }
    );
}

function getExpenses(req, res) {
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
}

function deleteExpense(req, res) {
    const expenseId = req.params.id;
    const userId = req.userId;

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

            const deleteSql = `
                DELETE FROM expenses
                WHERE id = ? AND userId = ?
            `;

            db.execute(
                deleteSql,
                [expenseId, userId],
                (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: "Failed to delete expense"
                        });
                    }

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

                            res.status(200).json({
                                message: "Expense deleted successfully"
                            });
                        }
                    );
                }
            );
        }
    );
}

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense
};

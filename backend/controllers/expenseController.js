const db = require("../utils/database");
const { categorizeExpense } = require("../services/aiService");

async function addExpense(req, res) {

    const { amount, description } = req.body;
    const userId = req.userId;

    try {

        const category = await categorizeExpense(description);

        await db.beginTransaction();

        const insertSql = `
            INSERT INTO expenses
            (amount, description, category, userId)
            VALUES (?, ?, ?, ?)
        `;

        await db.execute(
            insertSql,
            [amount, description, category, userId]
        );

        const updateSql = `
            UPDATE users
            SET totalExpense = totalExpense + ?
            WHERE id = ?
        `;

        await db.execute(
            updateSql,
            [amount, userId]
        );

        await db.commit();

        res.status(201).json({
            message: "Expense added successfully",
            category: category
        });

    } catch (error) {

        console.log("Add expense error:", error);

        try {
            await db.rollback();
        } catch (rollbackError) {
            console.log("Rollback error:", rollbackError);
        }

        res.status(500).json({
            message: "Failed to add expense"
        });
    }
}

async function getExpenses(req, res) {

    const userId = req.userId;

    try {

        const sql = `
            SELECT *
            FROM expenses
            WHERE userId = ?
            ORDER BY id DESC
        `;

        const [results] =
            await db.execute(sql, [userId]);


        res.status(200).json(results);


    } catch (error) {

        console.log("Get expenses error:", error);

        res.status(500).json({
            message: "Failed to fetch expenses"
        });

    }

}

async function deleteExpense(req, res) {

    const expenseId = req.params.id;
    const userId = req.userId;

    try {

        // Start transaction

        await db.beginTransaction();


        // 1. Get the expense amount

        const getExpense = `
            SELECT amount
            FROM expenses
            WHERE id = ? AND userId = ?
        `;

        const [results] =
            await db.execute(
                getExpense,
                [expenseId, userId]
            );


        if (results.length === 0) {

            await db.rollback();

            return res.status(403).json({
                message: "You cannot delete this expense"
            });

        }


        const amount = results[0].amount;


        // 2. Delete expense

        const deleteSql = `
            DELETE FROM expenses
            WHERE id = ? AND userId = ?
        `;

        await db.execute(
            deleteSql,
            [expenseId, userId]
        );


        // 3. Reduce totalExpense

        const updateTotalExpense = `
            UPDATE users
            SET totalExpense = totalExpense - ?
            WHERE id = ?
        `;

        await db.execute(
            updateTotalExpense,
            [amount, userId]
        );


        // 4. Everything succeeded

        await db.commit();


        res.status(200).json({
            message: "Expense deleted successfully"
        });


    } catch (error) {

        console.log("Delete expense error:", error);


        // Something failed → undo everything

        try {
            await db.rollback();
        } catch (rollbackError) {
            console.log("Rollback error:", rollbackError);
        }


        res.status(500).json({
            message: "Failed to delete expense"
        });

    }

}

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense
};

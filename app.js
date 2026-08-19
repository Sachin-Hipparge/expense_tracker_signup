const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./utils/database");

const app = express();

app.use(cors());
app.use(express.json());


// ==================== SIGNUP ====================

app.post("/user/signup", (req, res) => {

    const { name, email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.execute(sql, [email], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Something went wrong"
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        bcrypt.hash(password, 10, (err, hash) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Something went wrong"
                });
            }

            const insertSql =
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

            db.execute(
                insertSql,
                [name, email, hash],
                (err, result) => {

                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: "Something went wrong"
                        });
                    }

                    res.status(201).json({
                        message: "User created successfully"
                    });
                }
            );
        });
    });
});


// ==================== LOGIN ====================

app.post("/user/login", (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.execute(sql, [email], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Something went wrong"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email"
            });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Something went wrong"
                });
            }

            if (!result) {
                return res.status(401).json({
                    message: "Incorrect password"
                });
            }

            res.status(200).json({
                message: "Login successful",
                userId: user.id
            });
        });
    });
});


// ==================== ADD EXPENSE ====================

app.post("/expense/add", (req, res) => {

    const { amount, description, category, userId } = req.body;

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

app.get("/expense/all/:userId", (req, res) => {

    const userId = req.params.userId;

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

app.delete("/expense/delete/:id", (req, res) => {

    const expenseId = req.params.id;

    const sql = "DELETE FROM expenses WHERE id = ?";

    db.execute(sql, [expenseId], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Failed to delete expense"
            });
        }

        res.status(200).json({
            message: "Expense deleted successfully"
        });
    });
});


// ==================== SERVER ====================

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
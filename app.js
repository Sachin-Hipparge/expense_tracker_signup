const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./utils/database");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "expense_tracker_secret";


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

            // Create JWT token
            const token = jwt.sign(
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.status(200).json({
                message: "Login successful",
                token: token
            });
        });
    });
});


// ==================== AUTHENTICATION MIDDLEWARE ====================

function authenticate(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, JWT_SECRET);

        req.userId = decoded.userId;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}


// ==================== ADD EXPENSE ====================

app.post("/expense/add", authenticate, (req, res) => {

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

app.get("/expense/all", authenticate, (req, res) => {

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

app.delete("/expense/delete/:id", authenticate, (req, res) => {

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


app.listen(3000, () => {
    console.log("Server running on port 3000");
});
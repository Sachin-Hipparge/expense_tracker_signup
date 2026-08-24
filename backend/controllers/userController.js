const db = require("../utils/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

function signup(req, res) {
    const { name, email, password } = req.body;

    const checkSql = "SELECT * FROM users WHERE email = ?";

    db.execute(checkSql, [email], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Password hashing failed" });
            }

            const insertSql = `
                INSERT INTO users (name, email, password)
                VALUES (?, ?, ?)
            `;

            db.execute(
                insertSql,
                [name, email, hashedPassword],
                (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: "Signup failed" });
                    }

                    res.status(201).json({
                        message: "User registered successfully"
                    });
                }
            );
        });
    });
}

function login(req, res) {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.execute(sql, [email], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email" });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Password comparison failed" });
            }

            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect password" });
            }

            const token = jwt.sign(
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.status(200).json({
                message: "Login successful",
                token
            });
        });
    });
}

function getPremiumStatus(req, res) {
    const userId = req.userId;

    const sql = `
        SELECT isPremium
        FROM users
        WHERE id = ?
    `;

    db.execute(sql, [userId], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            isPremium: results[0].isPremium
        });
    });
}

module.exports = {
    signup,
    login,
    getPremiumStatus
};

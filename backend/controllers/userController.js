const db = require("../utils/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");


// ==================== SIGNUP ====================

async function signup(req, res) {

    const { name, email, password } = req.body;

    try {

        // Check whether email already exists

        const checkSql = `
            SELECT *
            FROM users
            WHERE email = ?
        `;

        const [results] =
            await db.execute(checkSql, [email]);


        if (results.length > 0) {

            return res.status(409).json({
                message: "Email already registered"
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Insert user

        const insertSql = `
            INSERT INTO users
            (name, email, password)
            VALUES (?, ?, ?)
        `;

        await db.execute(
            insertSql,
            [name, email, hashedPassword]
        );


        res.status(201).json({
            message: "User registered successfully"
        });


    } catch (error) {

        console.log("Signup error:", error);

        res.status(500).json({
            message: "Signup failed"
        });

    }

}


// ==================== LOGIN ====================

async function login(req, res) {

    const { email, password } = req.body;

    try {

        // Find user

        const sql = `
            SELECT *
            FROM users
            WHERE email = ?
        `;

        const [results] =
            await db.execute(sql, [email]);


        if (results.length === 0) {

            return res.status(401).json({
                message: "Invalid email"
            });

        }


        const user = results[0];


        // Compare password

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isMatch) {

            return res.status(401).json({
                message: "Incorrect password"
            });

        }


        // Create JWT

        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: "1h" }
        );


        res.status(200).json({

            message: "Login successful",

            token

        });


    } catch (error) {

        console.log("Login error:", error);

        res.status(500).json({
            message: "Login failed"
        });

    }

}


// ==================== PREMIUM STATUS ====================

async function getPremiumStatus(req, res) {

    const userId = req.userId;

    try {

        const sql = `
            SELECT isPremium
            FROM users
            WHERE id = ?
        `;

        const [results] =
            await db.execute(sql, [userId]);


        if (results.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        res.status(200).json({

            isPremium:
                results[0].isPremium

        });


    } catch (error) {

        console.log(
            "Premium status error:",
            error
        );

        res.status(500).json({
            message: "Database error"
        });

    }

}


module.exports = {

    signup,

    login,

    getPremiumStatus

};
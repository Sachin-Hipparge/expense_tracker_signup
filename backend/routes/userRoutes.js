const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../utils/database");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== SIGNUP ====================

router.post("/signup", (req, res) => {

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

router.post("/login", (req, res) => {

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


        bcrypt.compare(
            password,
            user.password,
            (err, result) => {

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


                const token = jwt.sign(
                    {
                        userId: user.id
                    },
                    JWT_SECRET,
                    {
                        expiresIn: "1h"
                    }
                );


                res.status(200).json({

                    message: "Login successful",

                    token: token

                });

            }
        );

    });

});


module.exports = router;
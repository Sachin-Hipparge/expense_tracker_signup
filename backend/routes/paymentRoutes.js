const express = require("express");
const { Cashfree, CFEnvironment } = require("cashfree-pg");
const db = require("../utils/database");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Cashfree Configuration
const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

// Create Premium Order
router.get("/purchase-premium", authenticate, (req, res) => {

    const userId = req.userId;

    const getUser = "SELECT * FROM users WHERE id = ?";

    db.execute(getUser, [userId], (err, results) => {

        if (err) {
            return res.status(500).json({ message: "Database Error" });
        }

        const user = results[0];

        const orderId = "ORDER_" + Date.now();

const request = {
    order_id: orderId,
    order_amount: 499,
    order_currency: "INR",

    customer_details: {
        customer_id: String(user.id),
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: "9999999999"
    },

    order_meta: {
        return_url:
            "http://127.0.0.1:5500/frontend/expense.html?order_id={order_id}"
    }
};

        cashfree.PGCreateOrder(request)
            .then((response) => {

                const paymentSessionId =
                    response.data.payment_session_id;

                const insertOrder = `
                    INSERT INTO orders
                    (orderId, userId, amount, status)
                    VALUES (?, ?, ?, ?)
                `;

                db.execute(
                    insertOrder,
                    [orderId, userId, 499, "PENDING"],
                    (err) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Order save failed"
                            });
                        }

                        res.status(200).json({
                            paymentSessionId,
                            orderId
                        });
                    }
                );
            })
            .catch((err) => {

    console.log("========== CASHFREE ERROR ==========");
    console.log(err.response?.data || err.response || err);
    console.log("====================================");

    res.status(500).json({
        message: "Cashfree Error",
        error: err.response?.data || err.message
    });

});

    });

});
router.get("/verify-payment/:orderId", authenticate, (req, res) => {

    const orderId = req.params.orderId;
    const userId = req.userId;

    // Check that this order belongs to the logged-in user
    const findOrder = `
        SELECT *
        FROM orders
        WHERE orderId = ? AND userId = ?
    `;

    db.execute(
        findOrder,
        [orderId, userId],
        (err, results) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "Order not found"
                });

            }

            // Ask Cashfree for the payments made for this order
            cashfree.PGOrderFetchPayments(orderId)
                .then((response) => {

                    const payments = response.data;

                    if (!payments || payments.length === 0) {

                        return res.status(200).json({
                            message: "Payment pending"
                        });

                    }

                    const payment = payments[0];

                    // Payment successful
                    if (payment.payment_status === "SUCCESS") {

                        const updateOrder = `
                            UPDATE orders
                            SET status = 'SUCCESS'
                            WHERE orderId = ?
                        `;

                        db.execute(
                            updateOrder,
                            [orderId],
                            (err) => {

                                if (err) {
                                    console.log(err);

                                    return res.status(500).json({
                                        message: "Could not update order"
                                    });
                                }

                                const updateUser = `
                                    UPDATE users
                                    SET isPremium = true
                                    WHERE id = ?
                                `;

                                db.execute(
                                    updateUser,
                                    [userId],
                                    (err) => {

                                        if (err) {
                                            console.log(err);

                                            return res.status(500).json({
                                                message: "Could not update premium status"
                                            });
                                        }

                                        res.status(200).json({
                                            message: "Transaction successful",
                                            isPremium: true
                                        });

                                    }
                                );

                            }
                        );

                    }

                    // Payment failed
                    else if (
                        payment.payment_status === "FAILED"
                    ) {

                        const updateOrder = `
                            UPDATE orders
                            SET status = 'FAILED'
                            WHERE orderId = ?
                        `;

                        db.execute(
                            updateOrder,
                            [orderId],
                            (err) => {

                                if (err) {
                                    console.log(err);

                                    return res.status(500).json({
                                        message: "Could not update order"
                                    });
                                }

                                res.status(200).json({
                                    message: "TRANSACTION FAILED"
                                });

                            }
                        );

                    }

                    // Payment still pending
                    else {

                        res.status(200).json({
                            message: "Payment pending"
                        });

                    }

                })
                .catch((error) => {

                    console.log(error);

                    res.status(500).json({
                        message: "Could not verify payment"
                    });

                });

        }
    );

});

module.exports = router;
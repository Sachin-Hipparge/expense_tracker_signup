const { Cashfree, CFEnvironment } = require("cashfree-pg");
const db = require("../utils/database");

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);


// ==================== PURCHASE PREMIUM ====================

async function purchasePremium(req, res) {

    const userId = req.userId;

    try {

        // Get logged-in user

        const getUser = `
            SELECT *
            FROM users
            WHERE id = ?
        `;

        const [results] =
            await db.execute(
                getUser,
                [userId]
            );


        if (results.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        const user = results[0];

        const orderId =
            "ORDER_" + Date.now();


        // Create Cashfree order

        const request = {

            order_id: orderId,

            order_amount: 499,

            order_currency: "INR",

            customer_details: {

                customer_id:
                    String(user.id),

                customer_name:
                    user.name,

                customer_email:
                    user.email,

                customer_phone:
                    "9999999999"

            },

            order_meta: {

                return_url:
                    "http://127.0.0.1:5500/frontend/expense.html?order_id={order_id}"

            }

        };


        const response =
            await cashfree.PGCreateOrder(request);


        const paymentSessionId =
            response.data.payment_session_id;


        // Save order in database

        const insertOrder = `
            INSERT INTO orders
            (orderId, userId, amount, status)
            VALUES (?, ?, ?, ?)
        `;


        await db.execute(
            insertOrder,
            [orderId, userId, 499, "PENDING"]
        );


        res.status(200).json({

            paymentSessionId,

            orderId

        });


    } catch (error) {

        console.log(
            "========== CASHFREE ERROR =========="
        );

        console.log(
            error.response?.data ||
            error.response ||
            error
        );

        console.log(
            "===================================="
        );


        res.status(500).json({

            message: "Cashfree Error",

            error:
                error.response?.data ||
                error.message

        });

    }

}


// ==================== VERIFY PAYMENT ====================

async function verifyPayment(req, res) {

    const orderId =
        req.params.orderId;

    const userId =
        req.userId;


    try {

        // Check that order belongs to user

        const findOrder = `
            SELECT *
            FROM orders
            WHERE orderId = ?
            AND userId = ?
        `;


        const [results] =
            await db.execute(
                findOrder,
                [orderId, userId]
            );


        if (results.length === 0) {

            return res.status(404).json({

                message: "Order not found"

            });

        }


        // Ask Cashfree about payment

        const response =
            await cashfree.PGOrderFetchPayments(
                orderId
            );


        const payments =
            response.data;


        if (
            !payments ||
            payments.length === 0
        ) {

            return res.status(200).json({

                message: "Payment pending"

            });

        }


        const payment =
            payments[0];


        // ==================== SUCCESS ====================

        if (
            payment.payment_status ===
            "SUCCESS"
        ) {

            // Start transaction

            await db.beginTransaction();


            // Update order

            const updateOrder = `
                UPDATE orders
                SET status = 'SUCCESS'
                WHERE orderId = ?
            `;


            await db.execute(
                updateOrder,
                [orderId]
            );


            // Make user premium

            const updateUser = `
                UPDATE users
                SET isPremium = true
                WHERE id = ?
            `;


            await db.execute(
                updateUser,
                [userId]
            );


            // Both updates succeeded

            await db.commit();


            res.status(200).json({

                message:
                    "Transaction successful",

                isPremium: true

            });

        }


        // ==================== FAILED ====================

        else if (
            payment.payment_status ===
            "FAILED"
        ) {

            const updateOrder = `
                UPDATE orders
                SET status = 'FAILED'
                WHERE orderId = ?
            `;


            await db.execute(
                updateOrder,
                [orderId]
            );


            res.status(200).json({

                message:
                    "TRANSACTION FAILED"

            });

        }


        // ==================== PENDING ====================

        else {

            res.status(200).json({

                message:
                    "Payment pending"

            });

        }


    } catch (error) {

        console.log(
            "Payment verification error:",
            error
        );


        // If the success transaction failed,
        // undo its database changes.

        try {

            await db.rollback();

        } catch (rollbackError) {

            console.log(
                "Rollback error:",
                rollbackError
            );

        }


        res.status(500).json({

            message:
                "Could not verify payment"

        });

    }

}


module.exports = {

    purchasePremium,

    verifyPayment

};
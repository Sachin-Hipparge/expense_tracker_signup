const SibApiV3Sdk = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require("uuid");
const db = require("../utils/database");
const bcrypt = require("bcrypt");

async function forgotPassword(req, res) {

    console.log("FORGOT PASSWORD API HIT");

    const { email } = req.body;

    console.log("Email received:", email);

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    try {

        // 1. Find the user

        const findUserSql = `
            SELECT id, name, email
            FROM users
            WHERE email = ?
        `;

        const [users] =
            await db.execute(
                findUserSql,
                [email]
            );


        if (users.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        const user = users[0];


        // 2. Generate unique UUID

        const requestId = uuidv4();

        console.log(
            "Generated reset request ID:",
            requestId
        );


        // 3. Save reset request

        const insertRequestSql = `
            INSERT INTO ForgotPasswordRequests
            (id, userId, isActive)
            VALUES (?, ?, ?)
        `;

        await db.execute(
            insertRequestSql,
            [
                requestId,
                user.id,
                true
            ]
        );


        console.log(
            "Forgot password request saved"
        );


        // 4. Create reset URL

        const resetUrl =
            `http://localhost:3000/password/resetpassword/${requestId}`;


        console.log(
            "Reset URL:",
            resetUrl
        );


        // 5. Configure Brevo

        const client =
            SibApiV3Sdk.ApiClient.instance;

        const apiKey =
            client.authentications["api-key"];

        apiKey.apiKey =
            process.env.SENDINBLUE_API_KEY;


        const sendSmtpEmail =
            new SibApiV3Sdk.SendSmtpEmail();


        sendSmtpEmail.sender = {
            email:
                process.env.SENDER_EMAIL,

            name:
                "Expense Tracker"
        };


        sendSmtpEmail.to = [
            {
                email: user.email,
                name: user.name
            }
        ];


        sendSmtpEmail.subject =
            "Reset Your Expense Tracker Password";


        sendSmtpEmail.textContent = `
Hello ${user.name},

You requested a password reset for your Expense Tracker account.

Click the link below to reset your password:

${resetUrl}

This link can only be used once.

Thank you,
Expense Tracker
        `;


        // 6. Send email

        const apiInstance =
            new SibApiV3Sdk.TransactionalEmailsApi();


        await apiInstance.sendTransacEmail(
            sendSmtpEmail
        );


        console.log(
            "Brevo email sent successfully"
        );


        res.status(200).json({
            message:
                "Password reset email sent successfully"
        });


    } catch (error) {

        console.log(
            "Forgot password error:",
            error
        );


        res.status(500).json({
            message:
                "Could not process password reset"
        });

    }

}

async function showResetPasswordPage(req, res) {

    const requestId = req.params.id;

    try {

        const sql = `
            SELECT *
            FROM ForgotPasswordRequests
            WHERE id = ?
            AND isActive = true
        `;

        const [results] =
            await db.execute(
                sql,
                [requestId]
            );


        if (results.length === 0) {

            return res.status(400).send(
                "Invalid or expired password reset link"
            );

        }


        // Reset request is valid

       res.redirect(
    `http://127.0.0.1:5500/frontend/reset-password.html?id=${requestId}`
);


    } catch (error) {

        console.log(
            "Reset link verification error:",
            error
        );

        res.status(500).send(
            "Could not verify reset link"
        );

    }

}


async function resetPassword(req, res) {

    const requestId = req.params.id;
    const { password } = req.body;

    if (!password) {

        return res.status(400).json({
            message: "Password is required"
        });

    }

    try {

        // 1. Find the reset request

        const findRequestSql = `
            SELECT userId
            FROM ForgotPasswordRequests
            WHERE id = ?
            AND isActive = true
        `;

        const [requests] =
            await db.execute(
                findRequestSql,
                [requestId]
            );


        // Invalid or already-used link

        if (requests.length === 0) {

            return res.status(400).json({
                message:
                    "Invalid or expired password reset link"
            });

        }


        const userId =
            requests[0].userId;


        // 2. Hash the new password

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // 3. Update user's password

        const updateUserSql = `
            UPDATE users
            SET password = ?
            WHERE id = ?
        `;

        await db.execute(
            updateUserSql,
            [hashedPassword, userId]
        );


        // 4. Make reset link inactive

        const deactivateRequestSql = `
            UPDATE ForgotPasswordRequests
            SET isActive = false
            WHERE id = ?
        `;

        await db.execute(
            deactivateRequestSql,
            [requestId]
        );


        // 5. Success

        res.status(200).json({
            message:
                "Password reset successfully"
        });


    } catch (error) {

        console.log(
            "Reset password error:",
            error
        );

        res.status(500).json({
            message:
                "Could not reset password"
        });

    }

}

module.exports = {
    forgotPassword,
    showResetPasswordPage,
    resetPassword

};
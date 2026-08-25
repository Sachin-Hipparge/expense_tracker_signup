const SibApiV3Sdk = require("sib-api-v3-sdk");

async function forgotPassword(req, res) {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    try {

        const client = SibApiV3Sdk.ApiClient.instance;

        const apiKey = client.authentications["api-key"];
        apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

        const sendSmtpEmail =
            new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = {
            email: process.env.SENDER_EMAIL,
            name: "Expense Tracker"
        };

        sendSmtpEmail.to = [
            {
                email: email
            }
        ];

        sendSmtpEmail.subject = "Forgot Password";

        sendSmtpEmail.textContent =
            "You requested a password reset for your Expense Tracker account.";

        const apiInstance =
            new SibApiV3Sdk.TransactionalEmailsApi();

        await apiInstance.sendTransacEmail(
            sendSmtpEmail
        );

        res.status(200).json({
            message: "Password reset email sent successfully"
        });

    } catch (error) {

        console.log("Sendinblue error:", error);

        res.status(500).json({
            message: "Could not send email"
        });
    }
}

module.exports = {
    forgotPassword
};
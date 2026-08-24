const jwt = require("jsonwebtoken");

const JWT_SECRET = "expense_tracker_secret";

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

module.exports = {
    authenticate,
    JWT_SECRET
};
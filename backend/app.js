require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();


// Middleware

app.use(cors());

app.use(express.json());


// Routes

app.use("/user", userRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/expense", expenseRoutes);
app.use("/purchase", paymentRoutes);
app.use("/password", passwordRoutes);


// Start server

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
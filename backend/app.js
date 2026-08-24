require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const app = express();


// Middleware

app.use(cors());

app.use(express.json());


// Routes

app.use("/user", userRoutes);
app.use("/leaderboard", leaderboardRoutes);

app.use("/expense", expenseRoutes);

app.use("/purchase", paymentRoutes);


// Start server

app.listen(3000, () => {

    console.log("Server running on port 3000");

});
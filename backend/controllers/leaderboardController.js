const db = require("../utils/database");

async function getLeaderboard(req, res) {

    const userId = req.userId;

    try {

        const leaderboardQuery = `
            SELECT
                id,
                name,
                totalExpense
            FROM users
            WHERE EXISTS (
                SELECT 1
                FROM users AS currentUser
                WHERE currentUser.id = ?
                AND currentUser.isPremium = true
            )
            ORDER BY totalExpense DESC
        `;

        const [results] =
            await db.execute(
                leaderboardQuery,
                [userId]
            );


        res.status(200).json(results);


    } catch (error) {

        console.log(
            "Leaderboard error:",
            error
        );

        res.status(500).json({
            message: "Database error"
        });

    }

}

module.exports = {
    getLeaderboard
};
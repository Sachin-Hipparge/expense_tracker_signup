const db = require("../utils/database");

function getLeaderboard(req, res) {
    const userId = req.userId;

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

    db.execute(
        leaderboardQuery,
        [userId],
        (err, results) => {
            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.status(200).json(results);
        }
    );
}

module.exports = {
    getLeaderboard
};

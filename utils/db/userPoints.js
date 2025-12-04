import { db } from "../../db.js";
import { updateCoins } from "./users.js";
import { createFestCoinsTransaction } from "./festcoinsTransactions.js";

// Get user points
export function getUserPoints(userId) {
    try {
        let points = db.prepare(`
            SELECT * FROM user_points WHERE userId = ?
        `).get(userId);
        
        // Create record if doesn't exist
        if (!points) {
            db.prepare(`
                INSERT INTO user_points (userId, currentPoints, totalPointsEarned, totalRewardsClaimed)
                VALUES (?, 0, 0, 0)
            `).run(userId);
            points = db.prepare(`
                SELECT * FROM user_points WHERE userId = ?
            `).get(userId);
        }
        
        return points;
    } catch (err) {
        console.error(err);
        return { userId, currentPoints: 0, totalPointsEarned: 0, totalRewardsClaimed: 0 };
    }
}

// Add points to user (1 FestCoin = 1 point)
export function addUserPoints(userId, festCoinsSpent) {
    try {
        const points = getUserPoints(userId);
        const newPoints = points.currentPoints + festCoinsSpent;
        const newTotalEarned = points.totalPointsEarned + festCoinsSpent;
        
        db.prepare(`
            UPDATE user_points 
            SET currentPoints = ?, 
                totalPointsEarned = ?,
                lastUpdated = CURRENT_TIMESTAMP
            WHERE userId = ?
        `).run(newPoints, newTotalEarned, userId);
        
        return { success: true, newPoints, canClaimReward: newPoints >= 100 };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Claim reward (10 FestCoins when reaching 100 points)
export function claimPointsReward(userId) {
    try {
        const points = getUserPoints(userId);
        
        if (points.currentPoints < 100) {
            return { success: false, error: "Niet genoeg punten. Je hebt 100 punten nodig." };
        }
        
        db.prepare("BEGIN TRANSACTION").run();
        
        // Reset points (subtract 100)
        const newPoints = points.currentPoints - 100;
        const newRewardsClaimed = points.totalRewardsClaimed + 1;
        
        db.prepare(`
            UPDATE user_points 
            SET currentPoints = ?,
                totalRewardsClaimed = ?,
                lastUpdated = CURRENT_TIMESTAMP
            WHERE userId = ?
        `).run(newPoints, newRewardsClaimed, userId);
        
        // Add 10 FestCoins to user
        updateCoins({ value: 10, user: { id: userId } });
        
        // Create festcoins transaction for reward
        createFestCoinsTransaction({
            userId: userId,
            type: 'reward',
            amount: 10,
            description: 'FestSpark BONUS'
        });
        
        db.prepare("COMMIT").run();
        
        return { 
            success: true, 
            newPoints, 
            festCoinsAdded: 10,
            totalRewardsClaimed: newRewardsClaimed
        };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}


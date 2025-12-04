import { db } from "../../db.js";

// Create FestCoins transaction
export function createFestCoinsTransaction({userId, type, amount, relatedUserId, groepspotId, description}){
    try {
        return db.prepare(`
            INSERT INTO festcoins_transactions (userId, type, amount, relatedUserId, groepspotId, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, type, amount, relatedUserId || null, groepspotId || null, description || null);
    } catch (err) {
        console.error(err);
        return null;
    }
}

// Get FestCoins transactions for a user
export function getFestCoinsTransactions(userId, limit = null){
    try {
        const query = limit 
            ? `SELECT ft.*, u.name as relatedUserName 
               FROM festcoins_transactions ft
               LEFT JOIN users u ON ft.relatedUserId = u.id
               WHERE ft.userId = ? 
               ORDER BY ft.createdAt DESC LIMIT ?`
            : `SELECT ft.*, u.name as relatedUserName 
               FROM festcoins_transactions ft
               LEFT JOIN users u ON ft.relatedUserId = u.id
               WHERE ft.userId = ? 
               ORDER BY ft.createdAt DESC`;
        return limit 
            ? db.prepare(query).all(userId, limit)
            : db.prepare(query).all(userId);
    } catch (err) {
        console.error(err);
        return [];
    }
}


import { db } from "../../db.js";
import { getFestcoinsById, updateCoins } from "./users.js";
import { addUserPoints } from "./userPoints.js";

// Create groepspot
export function createGroepspot({creatorId, eventId, totalAmount, qrCode, items}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        const result = db.prepare(`
            INSERT INTO groepspot (creatorId, eventId, totalAmount, remainingAmount, qrCode, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `).run(creatorId, eventId, totalAmount, totalAmount, qrCode);

        const groepspotId = result.lastInsertRowid;

        // Insert items
        const insertItem = db.prepare(`
            INSERT INTO groepspot_items (groepspotId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);

        items.forEach(item => {
            insertItem.run(groepspotId, item.id, item.name, item.price, item.quantity);
        });

        db.prepare("COMMIT").run();
        return { success: true, groepspotId, qrCode };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function getGroepspotByQrCode(qrCode){
    return db.prepare(`
        SELECT * FROM groepspot WHERE qrCode = ?
    `).get(qrCode);
}

export function getGroepspotById(id){
    return db.prepare(`
        SELECT * FROM groepspot WHERE id = ?
    `).get(id);
}

export function addGroepspotContribution({groepspotId, contributorId, amount}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        // Check if groepspot exists and get current remaining
        const groepspot = getGroepspotById(groepspotId);
        if (!groepspot) throw new Error("Groepspot niet gevonden");
        if (groepspot.status !== 'pending') throw new Error("Groepspot is al afgehandeld");
        if (amount > groepspot.remainingAmount) throw new Error("Bijdrage is te groot");

        // Check if user has enough coins
        const balance = getFestcoinsById(contributorId);
        if (amount > balance) throw new Error("Niet genoeg FestCoins");

        // Add contribution
        const contributionResult = db.prepare(`
            INSERT INTO groepspot_contributions (groepspotId, contributorId, amount)
            VALUES (?, ?, ?)
        `).run(groepspotId, contributorId, amount);

        // Update remaining amount
        const newRemaining = groepspot.remainingAmount - amount;
        db.prepare(`
            UPDATE groepspot
            SET remainingAmount = ?
            WHERE id = ?
        `).run(newRemaining, groepspotId);

        db.prepare("COMMIT").run();
        return { success: true, remainingAmount: newRemaining, contributionId: contributionResult.lastInsertRowid };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function updateGroepspotContribution({contributionId, newAmount, userId}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        // Get contribution
        const contribution = db.prepare(`
            SELECT gc.*, g.remainingAmount, g.status, g.totalAmount
            FROM groepspot_contributions gc
            JOIN groepspot g ON gc.groepspotId = g.id
            WHERE gc.id = ? AND gc.contributorId = ?
        `).get(contributionId, userId);

        if (!contribution) throw new Error("Bijdrage niet gevonden");
        if (contribution.status !== 'pending') throw new Error("Groepspot is al afgehandeld");

        const oldAmount = contribution.amount;
        const difference = newAmount - oldAmount;

        // Check if new amount is valid
        if (newAmount < 0) throw new Error("Bijdrage kan niet negatief zijn");
        if (newAmount > contribution.remainingAmount + oldAmount) {
            throw new Error(`Maximum bijdrage is ${contribution.remainingAmount + oldAmount} FestCoins`);
        }

        // Check balance if increasing
        if (difference > 0) {
            const balance = getFestcoinsById(userId);
            if (difference > balance) throw new Error("Niet genoeg FestCoins");
        }

        // Update contribution
        db.prepare(`
            UPDATE groepspot_contributions
            SET amount = ?
            WHERE id = ?
        `).run(newAmount, contributionId);

        // Update remaining amount
        const newRemaining = contribution.remainingAmount + oldAmount - newAmount;
        db.prepare(`
            UPDATE groepspot
            SET remainingAmount = ?
            WHERE id = ?
        `).run(newRemaining, contribution.groepspotId);

        db.prepare("COMMIT").run();
        return { success: true, remainingAmount: newRemaining };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function deleteGroepspotContribution({contributionId, userId}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        // Get contribution
        const contribution = db.prepare(`
            SELECT gc.*, g.remainingAmount, g.status
            FROM groepspot_contributions gc
            JOIN groepspot g ON gc.groepspotId = g.id
            WHERE gc.id = ? AND gc.contributorId = ?
        `).get(contributionId, userId);

        if (!contribution) throw new Error("Bijdrage niet gevonden");
        if (contribution.status !== 'pending') throw new Error("Groepspot is al afgehandeld");

        // Delete contribution
        db.prepare(`
            DELETE FROM groepspot_contributions
            WHERE id = ?
        `).run(contributionId);

        // Update remaining amount
        const newRemaining = contribution.remainingAmount + contribution.amount;
        db.prepare(`
            UPDATE groepspot
            SET remainingAmount = ?
            WHERE id = ?
        `).run(newRemaining, contribution.groepspotId);

        db.prepare("COMMIT").run();
        return { success: true, remainingAmount: newRemaining };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function getCreatorContribution(groepspotId, creatorId){
    return db.prepare(`
        SELECT * FROM groepspot_contributions
        WHERE groepspotId = ? AND contributorId = ?
    `).get(groepspotId, creatorId);
}

export function getGroepspotContributions(groepspotId){
    return db.prepare(`
        SELECT gc.*, u.name as contributorName, gc.contributorId
        FROM groepspot_contributions gc
        LEFT JOIN users u ON gc.contributorId = u.id
        WHERE gc.groepspotId = ?
        ORDER BY gc.createdAt ASC
    `).all(groepspotId);
}

export function getGroepspotItems(groepspotId){
    return db.prepare(`
        SELECT * FROM groepspot_items
        WHERE groepspotId = ?
    `).all(groepspotId);
}

export function finalizeGroepspot(groepspotId){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        const groepspot = getGroepspotById(groepspotId);
        if (!groepspot) throw new Error("Groepspot niet gevonden");
        if (groepspot.remainingAmount > 0) throw new Error("Nog niet volledig betaald");
        if (groepspot.status !== 'pending') throw new Error("Groepspot is al afgehandeld");

        // Get all contributions
        const contributions = getGroepspotContributions(groepspotId);

        // Deduct coins from all contributors
        contributions.forEach(contrib => {
            const result = updateCoins({ value: -contrib.amount, user: { id: contrib.contributorId } });
            if (result === false) throw new Error(`Kon niet betalen voor gebruiker ${contrib.contributorId}`);
        });

        // Create transaction
        const transactionResult = db.prepare(`
            INSERT INTO transactions (bezoekerId, totalPrice) VALUES (?, ?)
        `).run(groepspot.creatorId, groepspot.totalAmount);

        const transactionId = transactionResult.lastInsertRowid;

        // Get items and add to transaction
        const items = db.prepare(`
            SELECT * FROM groepspot_items WHERE groepspotId = ?
        `).all(groepspotId);

        const insertItem = db.prepare(`
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);
        const updateStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");

        items.forEach(item => {
            insertItem.run(transactionId, item.itemId, item.itemName, item.itemPrice, item.quantity);
            updateStock.run(item.quantity, item.itemId);
        });

        // Update groepspot status
        db.prepare(`
            UPDATE groepspot SET status = 'completed' WHERE id = ?
        `).run(groepspotId);

        // Add points to creator (1 FestCoin = 1 point)
        addUserPoints(groepspot.creatorId, groepspot.totalAmount);

        db.prepare("COMMIT").run();
        return { success: true, transactionId };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}


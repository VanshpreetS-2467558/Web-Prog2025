import { db } from "../../db.js";

// Get all budget alarms for a user
export function getBudgetAlarms(userId) {
    return db.prepare(`
        SELECT * FROM budget_alarms 
        WHERE userId = ? 
        ORDER BY category ASC
    `).all(userId);
}

// Get active budget alarms for a user
export function getActiveBudgetAlarms(userId) {
    return db.prepare(`
        SELECT * FROM budget_alarms 
        WHERE userId = ? AND isActive = 1
        ORDER BY category ASC
    `).all(userId);
}

// Get budget alarm by user and category
export function getBudgetAlarmByCategory(userId, category) {
    return db.prepare(`
        SELECT * FROM budget_alarms 
        WHERE userId = ? AND category = ?
    `).get(userId, category);
}

// Create or update budget alarm
export function upsertBudgetAlarm(userId, category, budgetLimit, resetSpending = false) {
    try {
        // Add resetDate column if it doesn't exist (migration)
        try {
            db.prepare(`ALTER TABLE budget_alarms ADD COLUMN resetDate TEXT DEFAULT NULL`).run();
        } catch (err) {
            // Column already exists, ignore error
        }

        const existing = getBudgetAlarmByCategory(userId, category);
        if (existing) {
            // If resetSpending is true, set resetDate to now
            const resetDate = resetSpending ? new Date().toISOString() : existing.resetDate;
            db.prepare(`
                UPDATE budget_alarms 
                SET budgetLimit = ?, isActive = 1, resetDate = ?
                WHERE userId = ? AND category = ?
            `).run(budgetLimit, resetDate, userId, category);
            return { success: true, id: existing.id };
        } else {
            const result = db.prepare(`
                INSERT INTO budget_alarms (userId, category, budgetLimit, isActive, resetDate)
                VALUES (?, ?, ?, 1, NULL)
            `).run(userId, category, budgetLimit);
            return { success: true, id: result.lastInsertRowid };
        }
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Delete budget alarm
export function deleteBudgetAlarm(userId, alarmId) {
    try {
        const result = db.prepare(`
            DELETE FROM budget_alarms 
            WHERE id = ? AND userId = ?
        `).run(alarmId, userId);
        return { success: true, deleted: result.changes > 0 };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Toggle budget alarm active status
export function toggleBudgetAlarm(userId, alarmId) {
    try {
        const alarm = db.prepare(`
            SELECT isActive FROM budget_alarms 
            WHERE id = ? AND userId = ?
        `).get(alarmId, userId);
        
        if (!alarm) {
            return { success: false, error: "Alarm niet gevonden" };
        }

        const newStatus = alarm.isActive ? 0 : 1;
        db.prepare(`
            UPDATE budget_alarms 
            SET isActive = ?
            WHERE id = ? AND userId = ?
        `).run(newStatus, alarmId, userId);
        
        return { success: true, isActive: newStatus === 1 };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Calculate total spending per category for a user (from transactions)
// If resetDate is set in budget_alarms, only count transactions after that date
export function getCategorySpending(userId, category) {
    // Check if there's a resetDate for this category
    const alarm = getBudgetAlarmByCategory(userId, category);
    const resetDate = alarm?.resetDate;
    
    if (resetDate) {
        const result = db.prepare(`
            SELECT COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transactionId = t.id
            WHERE t.bezoekerId = ? AND COALESCE(ti.itemCategory, 'Others') = ? AND datetime(t.date) > datetime(?)
        `).get(userId, category, resetDate);
        
        return result ? result.total : 0;
    } else {
        const result = db.prepare(`
            SELECT COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transactionId = t.id
            WHERE t.bezoekerId = ? AND COALESCE(ti.itemCategory, 'Others') = ?
        `).get(userId, category);
        
        return result ? result.total : 0;
    }
}

// Check if budget limit is exceeded and return info for notification
export function checkBudgetLimits(userId, itemsDict) {
    const activeAlarms = getActiveBudgetAlarms(userId);
    if (activeAlarms.length === 0) {
        return { exceeded: false };
    }

    // Calculate spending per category from this transaction
    const categorySpending = {};
    for (const [itemId, qty] of Object.entries(itemsDict)) {
        const item = db.prepare("SELECT category, price FROM items WHERE id = ?").get(itemId);
        if (item) {
            const amount = item.price * qty;
            categorySpending[item.category] = (categorySpending[item.category] || 0) + amount;
        }
    }

    // Check each active alarm
    const exceededAlarms = [];
    for (const alarm of activeAlarms) {
        const currentSpending = getCategorySpending(userId, alarm.category);
        const newSpending = currentSpending + (categorySpending[alarm.category] || 0);
        
        if (newSpending > alarm.budgetLimit) {
            exceededAlarms.push({
                category: alarm.category,
                currentSpending: currentSpending,
                newSpending: newSpending,
                budgetLimit: alarm.budgetLimit,
                exceededBy: newSpending - alarm.budgetLimit
            });
        }
    }

    if (exceededAlarms.length > 0) {
        return { exceeded: true, alarms: exceededAlarms };
    }

    return { exceeded: false };
}


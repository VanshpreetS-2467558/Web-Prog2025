import { db } from "../../db.js";
import { getGroepspotContributions, getGroepspotItems } from "./groepspot.js";

// Get spending per category for a user
export function getSpendingPerCategory(userId) {
    try {
        const result = db.prepare(`
            SELECT 
                COALESCE(ti.itemCategory, 'Others') as category,
                COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transactionId = t.id
            WHERE t.bezoekerId = ?
            GROUP BY ti.itemCategory
        `).all(userId);
        
        // Ensure all categories are represented
        const categories = ['Drank', 'Eten', 'Others'];
        const categoryMap = {};
        result.forEach(row => {
            categoryMap[row.category] = row.total;
        });
        
        return categories.map(cat => ({
            category: cat,
            total: categoryMap[cat] || 0
        }));
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Get spending per event for a user (ordered by most recent visit)
export function getSpendingPerEvent(userId) {
    try {
        // Get transactions with event info via transaction_items -> items -> stations -> events
        // Order by most recent transaction date
        const result = db.prepare(`
            SELECT 
                e.id as eventId,
                e.name as eventName,
                COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total,
                COUNT(DISTINCT t.id) as transactionCount,
                MAX(t.date) as lastVisit
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            JOIN events e ON s.eventId = e.id
            WHERE t.bezoekerId = ?
            GROUP BY e.id, e.name
            ORDER BY lastVisit DESC
        `).all(userId);
        
        return result;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Get detailed spending for a specific event
export function getEventSpendingDetails(userId, eventId) {
    try {
        // Get event info
        const eventInfo = db.prepare(`
            SELECT id, name, description, location, startDate, endDate
            FROM events
            WHERE id = ?
        `).get(eventId);
        
        const transactions = db.prepare(`
            SELECT 
                t.id as transactionId,
                t.date,
                t.totalPrice,
                GROUP_CONCAT(ti.itemName || ' x' || ti.quantity, ', ') as items
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            WHERE t.bezoekerId = ? AND s.eventId = ?
            GROUP BY t.id
            ORDER BY t.date DESC
        `).all(userId, eventId);
        
        const total = db.prepare(`
            SELECT COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            WHERE t.bezoekerId = ? AND s.eventId = ?
        `).get(userId, eventId);
        
        const categoryBreakdown = db.prepare(`
            SELECT 
                COALESCE(ti.itemCategory, 'Others') as category,
                COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            LEFT JOIN items i ON ti.itemId = i.id
            LEFT JOIN stations s ON i.locationId = s.id
            WHERE t.bezoekerId = ? AND s.eventId = ?
            GROUP BY ti.itemCategory
        `).all(userId, eventId);
        
        return {
            eventInfo: eventInfo || null,
            total: total?.total || 0,
            transactions: transactions,
            categoryBreakdown: categoryBreakdown
        };
    } catch (err) {
        console.error(err);
        return { eventInfo: null, total: 0, transactions: [], categoryBreakdown: [] };
    }
}

// Get spending today
export function getSpendingToday(userId) {
    try {
        const result = db.prepare(`
            SELECT COALESCE(SUM(totalPrice), 0) as total
            FROM transactions
            WHERE bezoekerId = ? AND date(date) = date('now')
        `).get(userId);
        
        return result?.total || 0;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

// Get total spending (all time)
export function getTotalSpending(userId) {
    try {
        const result = db.prepare(`
            SELECT COALESCE(SUM(totalPrice), 0) as total
            FROM transactions
            WHERE bezoekerId = ?
        `).get(userId);
        
        return result?.total || 0;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

// Get user transactions with full details (items, event, etc.)
export function getUserTransactions(userId, limit = null) {
    try {
        // First get all transactions
        const transactionsQuery = limit 
            ? `SELECT id, date, totalPrice FROM transactions WHERE bezoekerId = ? ORDER BY date DESC LIMIT ?`
            : `SELECT id, date, totalPrice FROM transactions WHERE bezoekerId = ? ORDER BY date DESC`;
        
        const transactions = limit 
            ? db.prepare(transactionsQuery).all(userId, limit)
            : db.prepare(transactionsQuery).all(userId);
        
        // Then enrich each transaction with items and event info
        const enrichedTransactions = transactions.map(trans => {
            // Check if this is a groepspot transaction by checking if items match a groepspot
            const groepspotCheck = db.prepare(`
                SELECT g.id, g.eventId, g.totalAmount, g.createdAt, e.name as eventName
                FROM groepspot g
                LEFT JOIN events e ON g.eventId = e.id
                WHERE g.creatorId = ? AND g.status = 'completed'
                AND g.totalAmount = ?
                AND EXISTS (
                    SELECT 1 FROM transactions t
                    WHERE t.id = ? AND t.bezoekerId = g.creatorId
                )
                ORDER BY g.createdAt DESC
                LIMIT 1
            `).get(userId, trans.totalPrice, trans.id);
            
            if (groepspotCheck) {
                // This is a groepspot transaction
                const groepspotId = groepspotCheck.id;
                const contributions = getGroepspotContributions(groepspotId);
                const items = getGroepspotItems(groepspotId);
                
                // Get station info from items
                const stationInfo = items.length > 0 ? db.prepare(`
                    SELECT s.name as stationName, s.id as stationId
                    FROM items i
                    JOIN stations s ON i.locationId = s.id
                    WHERE i.id = ?
                `).get(items[0].itemId) : null;
                
                const itemsString = items.map(item => `${item.itemName} x${item.quantity}`).join(' | ');
                
                // Sum contributions per user
                const contributionsByUser = {};
                contributions.forEach(c => {
                    if (!contributionsByUser[c.contributorId]) {
                        contributionsByUser[c.contributorId] = {
                            contributorId: c.contributorId,
                            contributorName: c.contributorName || 'Onbekend',
                            amount: 0,
                            createdAt: c.createdAt
                        };
                    }
                    contributionsByUser[c.contributorId].amount += c.amount;
                });
                
                // Convert to array and sort by creation date
                const summedContributions = Object.values(contributionsByUser).sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                
                // Calculate total contribution for creator (sum all contributions from this user)
                const creatorContributionSum = contributions
                    .filter(c => c.contributorId === userId)
                    .reduce((sum, c) => sum + c.amount, 0);
                
                return {
                    ...trans,
                    isGroepspot: true,
                    groepspotId: groepspotId,
                    eventId: groepspotCheck.eventId,
                    eventName: groepspotCheck.eventName || 'Onbekend event',
                    stationName: stationInfo?.stationName || 'Onbekend station',
                    items: itemsString,
                    totalAmount: groepspotCheck.totalAmount,
                    contributions: summedContributions,
                    creatorContribution: creatorContributionSum
                };
            } else {
                // Regular transaction
                const items = db.prepare(`
                    SELECT 
                        ti.itemName,
                        ti.quantity,
                        ti.itemPrice,
                        COALESCE(ti.itemCategory, 'Others') as category,
                        s.name as stationName,
                        s.eventId,
                        e.name as eventName
                    FROM transaction_items ti
                    LEFT JOIN items i ON ti.itemId = i.id
                    LEFT JOIN stations s ON i.locationId = s.id
                    LEFT JOIN events e ON s.eventId = e.id
                    WHERE ti.transactionId = ?
                `).all(trans.id);
                
                // Get unique event info (use first item's event)
                const eventInfo = items.length > 0 && items[0].eventId 
                    ? { eventId: items[0].eventId, eventName: items[0].eventName }
                    : { eventId: null, eventName: null };
                
                // Get unique station (use first item's station)
                const stationName = items.length > 0 ? items[0].stationName : null;
                
                // Create items string
                const itemsString = items.map(item => `${item.itemName} x${item.quantity}`).join(' | ');
                
                return {
                    ...trans,
                    isGroepspot: false,
                    eventId: eventInfo.eventId,
                    eventName: eventInfo.eventName,
                    stationName: stationName,
                    items: itemsString
                };
            }
        });
        
        return enrichedTransactions;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Get transaction details with all items (including groepspot details)
export function getTransactionDetails(transactionId, userId) {
    try {
        const transaction = db.prepare(`
            SELECT t.*
            FROM transactions t
            WHERE t.id = ? AND t.bezoekerId = ?
        `).get(transactionId, userId);
        
        if (!transaction) return null;
        
        // Check if this is a groepspot transaction
        const groepspot = db.prepare(`
            SELECT g.*, e.name as eventName, e.location as eventLocation
            FROM groepspot g
            LEFT JOIN events e ON g.eventId = e.id
            WHERE g.creatorId = ? AND g.status = 'completed'
            AND g.totalAmount = ?
            AND EXISTS (
                SELECT 1 FROM transactions t
                WHERE t.id = ? AND t.bezoekerId = g.creatorId
            )
            ORDER BY g.createdAt DESC
            LIMIT 1
        `).get(userId, transaction.totalPrice, transactionId);
        
        if (groepspot) {
            // Get groepspot details
            const contributions = getGroepspotContributions(groepspot.id);
            const items = getGroepspotItems(groepspot.id);
            
            // Get station info
            const stationInfo = items.length > 0 ? db.prepare(`
                SELECT s.name as stationName
                FROM items i
                JOIN stations s ON i.locationId = s.id
                WHERE i.id = ?
            `).get(items[0].itemId) : null;
            
            // Sum contributions per user
            const contributionsByUser = {};
            contributions.forEach(c => {
                if (!contributionsByUser[c.contributorId]) {
                    contributionsByUser[c.contributorId] = {
                        contributorId: c.contributorId,
                        contributorName: c.contributorName || 'Onbekend',
                        amount: 0,
                        createdAt: c.createdAt
                    };
                }
                contributionsByUser[c.contributorId].amount += c.amount;
            });
            
            // Convert to array and sort by creation date
            const summedContributions = Object.values(contributionsByUser).sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            // Calculate total contribution for creator
            const creatorTotalContribution = summedContributions
                .filter(c => c.contributorId === userId)
                .reduce((sum, c) => sum + c.amount, 0);
            
            return {
                ...transaction,
                isGroepspot: true,
                eventName: groepspot.eventName || 'Onbekend event',
                eventLocation: groepspot.eventLocation || null,
                groepspotDetails: {
                    eventName: groepspot.eventName || 'Onbekend event',
                    eventLocation: groepspot.eventLocation || null,
                    stationName: stationInfo?.stationName || 'Onbekend station',
                    totalAmount: groepspot.totalAmount,
                    creatorContribution: creatorTotalContribution,
                    contributions: summedContributions,
                    items: items
                }
            };
        } else {
            // Regular transaction
            const eventInfo = db.prepare(`
                SELECT DISTINCT e.id as eventId, e.name as eventName, e.location as eventLocation
                FROM transactions t
                JOIN transaction_items ti ON t.id = ti.transactionId
                JOIN items i ON ti.itemId = i.id
                JOIN stations s ON i.locationId = s.id
                JOIN events e ON s.eventId = e.id
                WHERE t.id = ?
                LIMIT 1
            `).get(transactionId);
            
            const items = db.prepare(`
                SELECT 
                    ti.*,
                    COALESCE(ti.itemCategory, 'Others') as category,
                    s.name as stationName,
                    e.name as eventName,
                    e.location as eventLocation
                FROM transaction_items ti
                LEFT JOIN items i ON ti.itemId = i.id
                LEFT JOIN stations s ON i.locationId = s.id
                LEFT JOIN events e ON s.eventId = e.id
                WHERE ti.transactionId = ?
            `).all(transactionId);
            
            // Get event location from first item if not in eventInfo
            const eventLocation = eventInfo?.eventLocation || (items.length > 0 ? items[0].eventLocation : null);
            
            return {
                ...transaction,
                isGroepspot: false,
                eventId: eventInfo?.eventId || null,
                eventName: eventInfo?.eventName || 'Onbekend event',
                eventLocation: eventLocation,
                items: items
            };
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}


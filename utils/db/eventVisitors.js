import { db } from "../../db.js";

export function searchExistingVisit(eventId, userId) {
  return db.prepare(
    `
        SELECT id FROM event_visitors
        WHERE eventId = ? AND userId = ? AND leftAt IS NULL
    `
  ).get(eventId, userId);
}

export function makeVisit(eventId, userId) {
  return db.prepare(
    `
        INSERT INTO event_visitors (eventId, userId)
        VALUES (?, ?)
    `
  ).run(eventId, userId);
}

export function closeVisit(eventId, userId) {
  return db.prepare(
    `
        UPDATE event_visitors
        SET leftAt = CURRENT_TIMESTAMP
        WHERE eventId = ? AND userId = ? AND leftAt IS NULL
        ORDER BY visitTime DESC
        LIMIT 1
    `
  ).run(eventId, userId);
}

export function updateVisitHeartbeat(eventId, userId){
    // Update last heartbeat or create new visit
    const existing = searchExistingVisit(eventId, userId);
    if(existing){
        // Update last heartbeat
        db.prepare(`
            UPDATE event_visitors
            SET lastHeartbeat = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(existing.id);
        return existing.id;
    } else {
        // Create new visit
        const result = makeVisit(eventId, userId);
        return result.lastInsertRowid;
    }
}

export function getActiveVisitorsCount(eventId){
    // Get visitors with heartbeat in last 2 minutes
    return db.prepare(`
        SELECT COUNT(DISTINCT userId) as count
        FROM event_visitors
        WHERE eventId = ? 
        AND leftAt IS NULL
        AND (lastHeartbeat IS NULL OR datetime(lastHeartbeat, '+2 minutes') > datetime('now'))
    `).get(eventId)?.count || 0;
}

export function cleanupOldVisits(){
    // Clean up visits older than 2 minutes without heartbeat
    return db.prepare(`
        UPDATE event_visitors
        SET leftAt = CURRENT_TIMESTAMP
        WHERE leftAt IS NULL
        AND lastHeartbeat IS NOT NULL
        AND datetime(lastHeartbeat, '+2 minutes') < datetime('now')
    `).run();
}


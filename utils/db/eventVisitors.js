import { db } from "../../db.js";

export function searchExistingVisit(eventId, userId) {
  // Find active visit (heartbeat within last 2 minutes)
  return db.prepare(
    `
        SELECT id FROM event_visitors
        WHERE eventId = ? AND userId = ?
        AND (lastHeartbeat IS NULL OR datetime(lastHeartbeat, '+2 minutes') > datetime('now'))
        ORDER BY visitTime DESC
        LIMIT 1
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

// closeVisit is no longer needed - visits are automatically inactive after 2 minutes without heartbeat
// Keeping function for backward compatibility but it does nothing
export function closeVisit(eventId, userId) {
  // No-op: visits are automatically inactive after 2 minutes without heartbeat
  return { changes: 0 };
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
    // A visitor is active if they have a heartbeat within the last 2 minutes
    return db.prepare(`
        SELECT COUNT(DISTINCT userId) as count
        FROM event_visitors
        WHERE eventId = ? 
        AND (lastHeartbeat IS NULL OR datetime(lastHeartbeat, '+2 minutes') > datetime('now'))
    `).get(eventId)?.count || 0;
}

// cleanupOldVisits is no longer needed - visits are automatically inactive after 2 minutes without heartbeat
// Keeping function for backward compatibility but it does nothing
export function cleanupOldVisits(){
    // No-op: visits are automatically inactive after 2 minutes without heartbeat
    return { changes: 0 };
}


import { db } from "../../db.js";

export function searchExistingVisit(eventId, userId) {
  // zoekt actieve bezoeker met heartbeat in de laatste 2 minuten en geen leftAt timestamp (als ze nog niet uitgecheckt zijn)
  return db.prepare(
    `
        SELECT id FROM event_visitors
        WHERE eventId = ? AND userId = ?
        AND leftAt IS NULL
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

// Close visit by setting leftAt timestamp
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
    // get aantal actieve bezoekers met heartbeat in de laatste 2 minuten en geen leftAt timestamp
    return db.prepare(`
        SELECT COUNT(DISTINCT userId) as count
        FROM event_visitors
        WHERE eventId = ? 
        AND leftAt IS NULL
        AND lastHeartbeat IS NOT NULL
        AND datetime(lastHeartbeat, '+2 minutes') > datetime('now')
    `).get(eventId)?.count || 0;
}

// Clean up visits older than 2 minutes without heartbeat by setting leftAt
export function cleanupOldVisits(){
    return db.prepare(`
        UPDATE event_visitors
        SET leftAt = CURRENT_TIMESTAMP
        WHERE leftAt IS NULL
        AND lastHeartbeat IS NOT NULL
        AND datetime(lastHeartbeat, '+2 minutes') < datetime('now')
    `).run();
}


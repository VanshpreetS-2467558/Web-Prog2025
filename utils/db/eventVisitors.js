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


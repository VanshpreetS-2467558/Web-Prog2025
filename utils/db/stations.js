import { db } from "../../db.js";

export function deleteLocation(id) {
  try {
    db.prepare("DELETE FROM stations WHERE id = ?").run(id);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, err };
  }
}

export function searchStationByEventId(eventId) {
  return db.prepare("SELECT * FROM stations WHERE eventId = ?").all(eventId);
}

export function getStationsById(userId) {
  return db
    .prepare(
      `
        SELECT s.id, s.name, s.eventId
        FROM stations s
        JOIN events e ON s.eventId = e.id
        WHERE e.organisatorid = ?
    `
    )
    .all(userId);
}

export function getStationsWithoutEmployeesByOrganisationId(orgId) {
  return db
    .prepare(
      `
        SELECT s.id, s.name, s.eventId, e.name AS eventName
        FROM stations s
        JOIN events e ON s.eventId = e.id
        WHERE e.organisatorid = ?
        AND s.id NOT IN (
            SELECT stationId FROM employees
            JOIN events ev ON employees.eventId = ev.id
            WHERE ev.organisatorid = ?
        )
    `
    )
    .all(orgId, orgId);
}


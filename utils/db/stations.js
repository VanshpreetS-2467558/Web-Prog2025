import { db } from "../../db.js";

export function deleteLocation(id) {
  try{
    db.prepare("BEGIN TRANSACTION").run();
    
    // First, delete all items in this station (to avoid foreign key constraint)
    db.prepare(`DELETE FROM items WHERE locationId = ?`).run(id);
    
    // Delete employees that reference this station
    db.prepare(`DELETE FROM employees WHERE stationId = ?`).run(id);
    
    // Now delete the station
    const result = db.prepare(`DELETE FROM stations WHERE id = ?`).run(id);
    
    db.prepare("COMMIT").run();
    
    if(result.changes === 0) {
        return { success: false, error: "Station niet gevonden" };
    }
    return { success: true };
  } catch(err){
    db.prepare("ROLLBACK").run();
    console.error(err);
    return { success: false, error: "Internal server error" };
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


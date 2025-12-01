import { db } from "../../db.js";

export function makeEmployeeAccount({ name, password, eventId, stationId }) {
  const result = db
    .prepare(
      `
    INSERT INTO users (role, name, email, phone, password, festCoins) 
    VALUES ('employee', ?, null, null, ?, null)
    `
    )
    .run(name, password);
  const user = result.lastInsertRowid;
  return db.prepare("INSERT INTO employees (userId, eventId, stationId) VALUES (?, ?, ?)").run(user, eventId, stationId);
}

export function getEmployeesByOrganisationId(orgId) {
  return db
    .prepare(
      `
        SELECT 
            u.id,
            u.name,
            e.name AS eventName,
            s.name AS stationName
        FROM users u
        JOIN employees emp ON u.id = emp.userId
        JOIN events e ON emp.eventId = e.id
        JOIN stations s ON emp.stationId = s.id
        WHERE e.organisatorid = ?
    `
    )
    .all(orgId);
}

export function getEmployeeStationNameById(userId) {
  const stmt = db.prepare(
    `
    SELECT s.name AS stationName
    FROM employees e
    JOIN stations s ON e.stationId = s.id
    WHERE e.userId = ?
  `
  );

  const result = stmt.get(userId);

  if (!result) {
    return null;
  }

  return result.stationName;
}


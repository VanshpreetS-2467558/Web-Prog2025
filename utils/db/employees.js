import { db } from "../../db.js";

export function makeEmployeeAccount({ name, password, eventId, stationId, encryptedPassword }) {
  const result = db
    .prepare(
      `
    INSERT INTO users (role, name, email, phone, password, festCoins) 
    VALUES ('employee', ?, null, null, ?, null)
    `
    )
    .run(name, password);
  const user = result.lastInsertRowid;
  return db.prepare("INSERT INTO employees (userId, eventId, stationId, encryptedPassword) VALUES (?, ?, ?, ?)").run(user, eventId, stationId, encryptedPassword);
}

export function getEmployeeEncryptedPassword(userId) {
  const result = db.prepare("SELECT encryptedPassword FROM employees WHERE userId = ?").get(userId);
  return result?.encryptedPassword || null;
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

export function getEmployeeStationId(userId) {
  const result = db.prepare(`
    SELECT stationId
    FROM employees
    WHERE userId = ?
  `).get(userId);

  return result ? result.stationId : null;
}

export function getEmployeeEventId(userId) {
  const result = db.prepare(`
    SELECT eventId
    FROM employees
    WHERE userId = ?
  `).get(userId);

  return result ? result.eventId : null;
}


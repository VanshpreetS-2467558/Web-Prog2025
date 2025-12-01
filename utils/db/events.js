import { db } from "../../db.js";

export function checkNameEvent(name) {
  return !!db.prepare("SELECT id FROM events WHERE LOWER(name) = LOWER(?)").get(name);
}

export function createEvent({ organisatorid, name, location, description, startDate, endDate }) {
  return db
    .prepare(`
            INSERT INTO events (organisatorid, name, location, description, startDate, endDate)
            VALUES (?, ?, ?, ?, ?, ?)
        `)
    .run(organisatorid, name, location, description || "", startDate, endDate);
}

export function deleteEvent(id) {
  try {
    db.prepare("DELETE FROM events WHERE id = ?").run(id);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, err };
  }
}

export function searchEventById(eventId) {
  return db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
}

export function updateEventById(eventId, updatedFields) {
  const fields = [];
  const values = [];

  for (const key in updatedFields) {
    fields.push(`${key} = ?`);
    values.push(updatedFields[key]);
  }

  values.push(eventId);

  const sql = `UPDATE events SET ${fields.join(", ")} WHERE id = ?`;

  return db.prepare(sql).run(...values);
}

export function getEventsById(userId) {
  return db
    .prepare(
      `
        SELECT id, name 
        FROM events 
        WHERE organisatorid = ?
    `
    )
    .all(userId);
}


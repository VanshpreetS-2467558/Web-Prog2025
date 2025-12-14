import { db } from "../../db.js";

export function checkEventName(name) {
  return !!db.prepare("SELECT id FROM events WHERE LOWER(name) = LOWER(?)").get(name);
}

export function checkStationName(eventId, name) {
  return !!db
    .prepare("SELECT id FROM stations WHERE eventId = ? AND LOWER(name) = LOWER(?)")
    .get(eventId, name);
}

export function checkItemName(locationId, name) {
  return !!db
    .prepare("SELECT id FROM items WHERE locationId = ? AND LOWER(name) = LOWER(?)")
    .get(locationId, name);
}

export function getAllEventsByOrganisator(organisatorid) {
  return db
    .prepare("SELECT * FROM events WHERE organisatorid = ?")
    .all(organisatorid) || [];
}

export function getAllStationsByEvent(eventId) {
  return db
    .prepare("SELECT * FROM stations WHERE eventId = ?")
    .all(eventId) || [];
}

export function getAllItemsByStation(locationId) {
  return db
    .prepare("SELECT * FROM items WHERE locationId = ?")
    .all(locationId) || [];
}

export function getAllEvents() {
  return db
    .prepare("SELECT * FROM events")
    .all() || [];
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
  try{
    db.prepare("BEGIN TRANSACTION").run();
    
    db.prepare(`DELETE FROM employees WHERE eventId = ?`).run(id);
    
    // Delete groepspot contributions and items (references groepspot)
    const groepspots = db.prepare(`SELECT id FROM groepspot WHERE eventId = ?`).all(id);
    groepspots.forEach(gs => {
        db.prepare(`DELETE FROM groepspot_contributions WHERE groepspotId = ?`).run(gs.id);
        db.prepare(`DELETE FROM groepspot_items WHERE groepspotId = ?`).run(gs.id);
    });
    
    db.prepare(`DELETE FROM groepspot WHERE eventId = ?`).run(id);

    db.prepare(`DELETE FROM event_visitors WHERE eventId = ?`).run(id);
    
    const stations = db.prepare(`SELECT id FROM stations WHERE eventId = ?`).all(id);
    
    // Delete transaction_items that reference items from these stations
    stations.forEach(station => {
        const items = db.prepare(`SELECT id FROM items WHERE locationId = ?`).all(station.id);
        items.forEach(item => {
            db.prepare(`DELETE FROM transaction_items WHERE itemId = ?`).run(item.id);
        });
        db.prepare(`DELETE FROM items WHERE locationId = ?`).run(station.id);
    });
    
    // Get all transaction IDs that have items from this event
    const transactionIds = db.prepare(`
        SELECT DISTINCT t.id 
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transactionId
        JOIN items i ON ti.itemId = i.id
        JOIN stations s ON i.locationId = s.id
        WHERE s.eventId = ?
    `).all(id).map(row => row.id);
    
    transactionIds.forEach(transId => {
        db.prepare(`DELETE FROM transaction_items WHERE transactionId = ?`).run(transId);
    });
    
    transactionIds.forEach(transId => {
        db.prepare(`DELETE FROM transactions WHERE id = ?`).run(transId);
    });
    
    db.prepare(`DELETE FROM stations WHERE eventId = ?`).run(id);
    
    const result = db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
    
    db.prepare("COMMIT").run();
    
    if(result.changes === 0) {
        return { success: false, error: "Event niet gevonden" };
    }
    return {success: true};
  } catch (err) {
    db.prepare("ROLLBACK").run();
    console.error(err);
    return { success: false, error: "Internal server error" };
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

export function createLocationByEvent(eventId, name) {
  db.prepare(`
    INSERT INTO stations (eventId, name)
    VALUES (?, ?)
  `).run(eventId, name);
}

export function createItemByLocation(locationId, name, price, stock, category) {
  db.prepare(`
      INSERT INTO items (locationId, name, price, stock, category)
      VALUES (?, ?, ?, ?, ?)
  `).run(locationId, name, price, stock, category);
}
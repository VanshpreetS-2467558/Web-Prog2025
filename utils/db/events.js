import { db } from "../../db.js";

export function checkEventName(name) {
  return !!db.prepare("SELECT id FROM events WHERE LOWER(name) = LOWER(?)").get(name);
}

// Alias for backward compatibility
export function checkNameEvent(name) {
  return checkEventName(name);
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
    
    // Delete in order to avoid foreign key constraint errors:
    // 1. Delete employees (references eventId and stationId)
    db.prepare(`DELETE FROM employees WHERE eventId = ?`).run(id);
    
    // 2. Delete groepspot contributions and items (references groepspot)
    const groepspots = db.prepare(`SELECT id FROM groepspot WHERE eventId = ?`).all(id);
    groepspots.forEach(gs => {
        db.prepare(`DELETE FROM groepspot_contributions WHERE groepspotId = ?`).run(gs.id);
        db.prepare(`DELETE FROM groepspot_items WHERE groepspotId = ?`).run(gs.id);
    });
    
    // 3. Delete groepspot (references eventId)
    db.prepare(`DELETE FROM groepspot WHERE eventId = ?`).run(id);
    
    // 4. Delete event_visitors (references eventId)
    db.prepare(`DELETE FROM event_visitors WHERE eventId = ?`).run(id);
    
    // 5. Get stations for this event to delete items and transaction_items
    const stations = db.prepare(`SELECT id FROM stations WHERE eventId = ?`).all(id);
    
    // 6. Delete transaction_items that reference items from these stations
    stations.forEach(station => {
        // Get all items in this station
        const items = db.prepare(`SELECT id FROM items WHERE locationId = ?`).all(station.id);
        items.forEach(item => {
            // Delete transaction_items that reference this item
            db.prepare(`DELETE FROM transaction_items WHERE itemId = ?`).run(item.id);
        });
        // Delete items in this station
        db.prepare(`DELETE FROM items WHERE locationId = ?`).run(station.id);
    });
    
    // 7. Delete transactions that reference this event (through stations -> items -> transaction_items)
    // Get all transaction IDs that have items from this event
    const transactionIds = db.prepare(`
        SELECT DISTINCT t.id 
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transactionId
        JOIN items i ON ti.itemId = i.id
        JOIN stations s ON i.locationId = s.id
        WHERE s.eventId = ?
    `).all(id).map(row => row.id);
    
    // Delete transaction_items for these transactions
    transactionIds.forEach(transId => {
        db.prepare(`DELETE FROM transaction_items WHERE transactionId = ?`).run(transId);
    });
    
    // Delete transactions
    transactionIds.forEach(transId => {
        db.prepare(`DELETE FROM transactions WHERE id = ?`).run(transId);
    });
    
    // 8. Delete stations (references eventId)
    db.prepare(`DELETE FROM stations WHERE eventId = ?`).run(id);
    
    // 9. Finally delete the event
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


import { db } from "../../db.js";

export function deleteItem(id) {
  try {
    db.prepare(
      `
            DELETE FROM items 
            WHERE id = ?
        `
    ).run(id);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, err };
  }
}

export function searchItemsByStationId(stationId) {
  return db.prepare("SELECT * FROM items WHERE locationId = ?").all(stationId);
}


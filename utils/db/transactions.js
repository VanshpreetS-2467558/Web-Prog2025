import { db } from "../../db.js";
import { getFestcoinsById, updateCoins } from "./users.js";

// Get recent transactions for a bezoeker (3 most recent)
export function getRecentTransactionsForBezoeker(userId, limit = 3) {
  const query = `
    SELECT 
      t.id,
      t.date,
      t.totalPrice,
      (SELECT GROUP_CONCAT(ti2.itemName || ' (' || ti2.quantity || 'x)')
       FROM transaction_items ti2
       WHERE ti2.transactionId = t.id) as items,
      COALESCE(MAX(s.name), 'Onbekend Station') as stationName
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    LEFT JOIN items i ON ti.itemId = i.id
    LEFT JOIN stations s ON i.locationId = s.id
    WHERE t.bezoekerId = ?
    GROUP BY t.id
    ORDER BY t.date DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(userId, limit);
}

// Get all transactions for a bezoeker
export function getAllTransactionsForBezoeker(userId) {
  const query = `
    SELECT 
      t.id,
      t.date,
      t.totalPrice,
      (SELECT GROUP_CONCAT(ti2.itemName || ' (' || ti2.quantity || 'x)')
       FROM transaction_items ti2
       WHERE ti2.transactionId = t.id) as items,
      COALESCE(MAX(s.name), 'Onbekend Station') as stationName
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    LEFT JOIN items i ON ti.itemId = i.id
    LEFT JOIN stations s ON i.locationId = s.id
    WHERE t.bezoekerId = ?
    GROUP BY t.id
    ORDER BY t.date DESC
  `;
  
  return db.prepare(query).all(userId);
}

// Get recent transactions for an organizer (from their events)
export function getRecentTransactionsForOrganizer(organizerId, eventId = null, limit = 3) {
  let query = `
    SELECT 
      t.id,
      t.date,
      t.totalPrice,
      (SELECT GROUP_CONCAT(ti2.itemName || ' (' || ti2.quantity || 'x)')
       FROM transaction_items ti2
       WHERE ti2.transactionId = t.id) as items,
      COALESCE(MAX(s.name), 'Onbekend Station') as stationName
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    JOIN stations s ON i.locationId = s.id
    JOIN events e ON s.eventId = e.id
    WHERE e.organisatorid = ?
  `;
  
  const params = [organizerId];
  
  if (eventId) {
    query += ` AND e.id = ?`;
    params.push(eventId);
  }
  
  query += `
    GROUP BY t.id
    ORDER BY t.date DESC
    LIMIT ?
  `;
  
  params.push(limit);
  
  return db.prepare(query).all(...params);
}

// Get all transactions for an organizer
export function getAllTransactionsForOrganizer(organizerId, eventId = null) {
  let query = `
    SELECT 
      t.id,
      t.date,
      t.totalPrice,
      (SELECT GROUP_CONCAT(ti2.itemName || ' (' || ti2.quantity || 'x)')
       FROM transaction_items ti2
       WHERE ti2.transactionId = t.id) as items,
      COALESCE(MAX(s.name), 'Onbekend Station') as stationName
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    JOIN stations s ON i.locationId = s.id
    JOIN events e ON s.eventId = e.id
    WHERE e.organisatorid = ?
  `;
  
  const params = [organizerId];
  
  if (eventId) {
    query += ` AND e.id = ?`;
    params.push(eventId);
  }
  
  query += `
    GROUP BY t.id
    ORDER BY t.date DESC
  `;
  
  return db.prepare(query).all(...params);
}

// Get recent transactions for an employee (from their station)
export function getRecentTransactionsForEmployee(employeeId, limit = 3) {
  const query = `
    SELECT 
      t.id,
      t.date,
      t.totalPrice,
      (SELECT GROUP_CONCAT(ti2.itemName || ' (' || ti2.quantity || 'x)')
       FROM transaction_items ti2
       WHERE ti2.transactionId = t.id) as items,
      MAX(s.name) as stationName
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    JOIN stations s ON i.locationId = s.id
    JOIN employees emp ON s.id = emp.stationId
    WHERE emp.userId = ?
    GROUP BY t.id
    ORDER BY t.date DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(employeeId, limit);
}

// Get all transactions for an employee
export function getAllTransactionsForEmployee(employeeId) {
  const query = `
    SELECT 
      t.id,
      t.date,
      t.totalPrice,
      (SELECT GROUP_CONCAT(ti2.itemName || ' (' || ti2.quantity || 'x)')
       FROM transaction_items ti2
       WHERE ti2.transactionId = t.id) as items,
      MAX(s.name) as stationName
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    JOIN stations s ON i.locationId = s.id
    JOIN employees emp ON s.id = emp.stationId
    WHERE emp.userId = ?
    GROUP BY t.id
    ORDER BY t.date DESC
  `;
  
  return db.prepare(query).all(employeeId);
}

export function makeTransaction(userId, itemsDict) {
  const itemsData = [];
  let totalPrice = 0;

  try {
    db.prepare("BEGIN TRANSACTION").run();

    for (const [itemId, qty] of Object.entries(itemsDict)) {
      const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
      if (!item) throw new Error(`Item ${itemId} bestaat niet`);
      if (qty > item.stock) throw new Error(`Niet genoeg voorraad van ${item.name}`);

      totalPrice += item.price * qty;

      itemsData.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty,
      });
    }

    const balance = getFestcoinsById(userId);
    if (totalPrice > balance) throw new Error("Te weinig FestCoins.");

    updateCoins({ value: -totalPrice, user: { id: userId } });

    const result = db
      .prepare(
        `
            INSERT INTO transactions (bezoekerId, totalPrice) VALUES (?, ?)
        `
      )
      .run(userId, totalPrice);

    const transactionId = result.lastInsertRowid;

    const insertItem = db.prepare(
      `
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `
    );
    const updateStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");

    itemsData.forEach((it) => {
      insertItem.run(transactionId, it.id, it.name, it.price, it.qty);
      updateStock.run(it.qty, it.id);
    });

    db.prepare("COMMIT").run();

    return { success: true, totalPrice, items: itemsData };
  } catch (err) {
    db.prepare("ROLLBACK").run();
    return { success: false, error: err.message };
  }
}


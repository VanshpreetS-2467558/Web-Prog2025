import { db } from "../../db.js";
import { getFestcoinsById, updateCoins } from "./users.js";
import { addUserPoints } from "./userPoints.js";
import crypto from "crypto";

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

export function makeTransaction(userId, itemsDict){
    const itemsData = [];
    let totalPrice = 0;

    try {
        db.prepare("BEGIN TRANSACTION").run();

        // 1. validate items + prijs berekenen
        for (const [itemId, qty] of Object.entries(itemsDict)) {
            const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
            if (!item) throw new Error(`Item ${itemId} bestaat niet`);
            if (qty > item.stock) throw new Error(`Niet genoeg voorraad van ${item.name}`);

            totalPrice += item.price * qty;

            itemsData.push({
                id: item.id,
                name: item.name,
                price: item.price,
                qty
            });
        }

        // 2. balance check
        const balance = getFestcoinsById(userId);
        if (totalPrice > balance) throw new Error("Te weinig FestCoins.");

        // 3. subtract coins
        updateCoins({ value: -totalPrice, user: { id: userId } });

        // 4. Generate unique QR code and random 6-digit order code
        const qrCode = `ORDER_${crypto.randomBytes(16).toString('hex')}`;
        
        // Generate random 6-digit code (ensure uniqueness)
        let orderCode;
        let isUnique = false;
        while (!isUnique) {
          orderCode = Math.floor(100000 + Math.random() * 900000).toString();
          const existing = db.prepare(`SELECT id FROM transactions WHERE orderCode = ?`).get(orderCode);
          if (!existing) {
            isUnique = true;
          }
        }

        // 5. maak transactie met QR code en order code
        const result = db.prepare(`
            INSERT INTO transactions (bezoekerId, totalPrice, qrCode, orderCode) VALUES (?, ?, ?, ?)
        `).run(userId, totalPrice, qrCode, orderCode);

        const transactionId = result.lastInsertRowid;

        // 5. Get station ID and name from first item (all items should be from same station)
        const firstItem = itemsData[0];
        const stationInfo = db.prepare(`
            SELECT s.id as stationId, s.name as stationName
            FROM items i
            JOIN stations s ON i.locationId = s.id
            WHERE i.id = ?
        `).get(firstItem.id);
        
        const stationId = stationInfo?.stationId || null;
        const stationName = stationInfo?.stationName || null;

        // 6. voeg items toe + update stock
        const insertItem = db.prepare(`
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity, itemCategory)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const updateStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");

        itemsData.forEach(it => {
            // Get category from item
            const item = db.prepare("SELECT category FROM items WHERE id = ?").get(it.id);
            const category = item?.category || 'Others';
            insertItem.run(transactionId, it.id, it.name, it.price, it.qty, category);
            updateStock.run(it.qty, it.id);
        });

        db.prepare("COMMIT").run();

        // Add points to user (1 FestCoin = 1 point)
        addUserPoints(userId, totalPrice);

        return { success: true, totalPrice, items: itemsData, transactionId, stationId, stationName, qrCode, orderCode };

    } catch (err) {
        db.prepare("ROLLBACK").run();
        return { success: false, error: err.message };
    }
}

// Get order details by transaction ID
export function getOrderDetails(transactionId) {
  try {
    const transaction = db.prepare(`
      SELECT t.*, s.id as stationId, s.name as stationName, s.eventId as orderEventId
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transactionId
      JOIN items i ON ti.itemId = i.id
      JOIN stations s ON i.locationId = s.id
      WHERE t.id = ?
      LIMIT 1
    `).get(transactionId);

    if (!transaction) return null;

    const items = db.prepare(`
      SELECT ti.itemName, ti.quantity, ti.itemPrice
      FROM transaction_items ti
      WHERE ti.transactionId = ?
    `).all(transactionId);

    return {
      transactionId: transaction.id,
      stationId: transaction.stationId,
      stationName: transaction.stationName || 'Onbekend station',
      orderEventId: transaction.orderEventId,
      totalPrice: transaction.totalPrice,
      handled: transaction.handled,
      qrCode: transaction.qrCode,
      orderCode: transaction.orderCode,
      items: items
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Get order details by QR code
export function getOrderDetailsByQrCode(qrCode) {
  try {
    const transaction = db.prepare(`
      SELECT t.*, s.id as stationId, s.name as stationName, s.eventId as orderEventId
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transactionId
      JOIN items i ON ti.itemId = i.id
      JOIN stations s ON i.locationId = s.id
      WHERE t.qrCode = ?
      LIMIT 1
    `).get(qrCode);

    if (!transaction) return null;

    const items = db.prepare(`
      SELECT ti.itemName, ti.quantity, ti.itemPrice
      FROM transaction_items ti
      WHERE ti.transactionId = ?
    `).all(transaction.id);

    return {
      transactionId: transaction.id,
      stationId: transaction.stationId,
      stationName: transaction.stationName || 'Onbekend station',
      orderEventId: transaction.orderEventId,
      totalPrice: transaction.totalPrice,
      handled: transaction.handled,
      qrCode: transaction.qrCode,
      orderCode: transaction.orderCode,
      items: items
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Get order details by order code (6-digit)
export function getOrderDetailsByOrderCode(orderCode) {
  try {
    const transaction = db.prepare(`
      SELECT t.*, s.id as stationId, s.name as stationName, s.eventId as orderEventId
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transactionId
      JOIN items i ON ti.itemId = i.id
      JOIN stations s ON i.locationId = s.id
      WHERE t.orderCode = ?
      LIMIT 1
    `).get(orderCode);

    if (!transaction) return null;

    const items = db.prepare(`
      SELECT ti.itemName, ti.quantity, ti.itemPrice
      FROM transaction_items ti
      WHERE ti.transactionId = ?
    `).all(transaction.id);

    return {
      transactionId: transaction.id,
      stationId: transaction.stationId,
      stationName: transaction.stationName || 'Onbekend station',
      orderEventId: transaction.orderEventId,
      totalPrice: transaction.totalPrice,
      handled: transaction.handled,
      qrCode: transaction.qrCode,
      orderCode: transaction.orderCode,
      items: items
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Mark order as handled
export function markOrderAsHandled(transactionId) {
  try {
    db.prepare(`
      UPDATE transactions
      SET handled = 1
      WHERE id = ?
    `).run(transactionId);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: err.message };
  }
}


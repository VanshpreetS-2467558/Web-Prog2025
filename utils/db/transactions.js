import { db } from "../../db.js";
import { getFestcoinsById, updateCoins } from "./users.js";

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

// Get transaction analysis data for a user within a date range
export function getTransactionAnalysis(userId, startDate = null, endDate = null) {
  let query = `
    SELECT 
      ti.quantity,
      ti.itemPrice,
      CASE 
        WHEN ti.itemId IS NULL THEN 'Onbekend'
        WHEN i.category IS NULL OR i.category = '' THEN 'Onbekend'
        ELSE i.category
      END as category
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    LEFT JOIN items i ON ti.itemId = i.id
    WHERE t.bezoekerId = ?
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ` AND DATE(t.date) >= DATE(?)`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND DATE(t.date) <= DATE(?)`;
    params.push(endDate);
  }
  
  return db.prepare(query).all(...params);
}

// Get total amount spent for a user within a date range
export function getTotalSpent(userId, startDate = null, endDate = null) {
  let query = `
    SELECT SUM(totalPrice) as total
    FROM transactions
    WHERE bezoekerId = ?
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ` AND DATE(date) >= DATE(?)`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND DATE(date) <= DATE(?)`;
    params.push(endDate);
  }
  
  const result = db.prepare(query).get(...params);
  return result?.total || 0;
}

// Get top 5 items by total money spent for a user within a date range
export function getTopItemsBySpending(userId, startDate = null, endDate = null) {
  let query = `
    SELECT 
      ti.itemName,
      SUM(ti.itemPrice * ti.quantity) as totalSpent,
      SUM(ti.quantity) as totalQuantity
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    WHERE t.bezoekerId = ?
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ` AND DATE(t.date) >= DATE(?)`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND DATE(t.date) <= DATE(?)`;
    params.push(endDate);
  }
  
  query += `
    GROUP BY ti.itemName
    ORDER BY totalSpent DESC
    LIMIT 5
  `;
  
  return db.prepare(query).all(...params);
}

// Get top 5 stations by total money spent for a user within a date range
export function getTopStationsBySpending(userId, startDate = null, endDate = null) {
  let query = `
    SELECT 
      COALESCE(s.name, 'Onbekend Station') as stationName,
      SUM(ti.itemPrice * ti.quantity) as totalSpent,
      SUM(ti.quantity) as totalQuantity
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    LEFT JOIN items i ON ti.itemId = i.id
    LEFT JOIN stations s ON i.locationId = s.id
    WHERE t.bezoekerId = ?
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ` AND DATE(t.date) >= DATE(?)`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND DATE(t.date) <= DATE(?)`;
    params.push(endDate);
  }
  
  query += `
    GROUP BY s.id, s.name
    ORDER BY totalSpent DESC
    LIMIT 5
  `;
  
  return db.prepare(query).all(...params);
}


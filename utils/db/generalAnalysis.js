import { db } from "../../db.js";

// Get total visitors across all events
export function getTotalVisitorsAll() {
  const result = db.prepare(`
    SELECT COUNT(DISTINCT ev.userId) as count
    FROM event_visitors ev
  `).get();
  return result?.count || 0;
}

// Get total revenue across all events
export function getTotalRevenueAll() {
  const result = db.prepare(`
    SELECT COALESCE(SUM(t.totalPrice), 0) as total
    FROM transactions t
  `).get();
  return result?.total || 0;
}

// Get total items sold across all events
export function getTotalItemsSoldAll() {
  const result = db.prepare(`
    SELECT COALESCE(SUM(ti.quantity), 0) as total
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
  `).get();
  return result?.total || 0;
}

// Get total events count
export function getTotalEventsCount() {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM events
  `).get();
  return result?.count || 0;
}

// Get top cities by visitors (extract city from location field)
// Location format: "Country, City" - we extract the city part
export function getTopCitiesByVisitors(limit = 10) {
  return db.prepare(`
    SELECT 
      CASE 
        WHEN e.location LIKE '%,%' THEN 
          TRIM(SUBSTR(e.location, INSTR(e.location, ',') + 1))
        ELSE 
          e.location
      END as city,
      COUNT(DISTINCT ev.userId) as visitorCount
    FROM event_visitors ev
    JOIN events e ON ev.eventId = e.id
    WHERE e.location IS NOT NULL AND e.location != ''
    GROUP BY city
    ORDER BY visitorCount DESC
    LIMIT ?
  `).all(limit);
}

// Get sales per category (revenue)
export function getCategorySalesRevenue() {
  return db.prepare(`
    SELECT 
      COALESCE(i.category, 'Onbekend') as category,
      COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as revenue
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    WHERE i.category IS NOT NULL
    GROUP BY i.category
    ORDER BY revenue DESC
  `).all();
}

// Get sales per category (quantity)
export function getCategorySalesQuantity() {
  return db.prepare(`
    SELECT 
      COALESCE(i.category, 'Onbekend') as category,
      COALESCE(SUM(ti.quantity), 0) as quantity
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    WHERE i.category IS NOT NULL
    GROUP BY i.category
    ORDER BY quantity DESC
  `).all();
}

// Get top items by sales (quantity)
export function getTopItemsBySales(limit = 5) {
  return db.prepare(`
    SELECT 
      ti.itemName,
      SUM(ti.quantity) as sold,
      SUM(ti.itemPrice * ti.quantity) as revenue
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    GROUP BY ti.itemName
    ORDER BY sold DESC
    LIMIT ?
  `).all(limit);
}

// Get category statistics (detailed breakdown)
export function getCategoryStatistics() {
  return db.prepare(`
    SELECT 
      COALESCE(i.category, 'Onbekend') as category,
      COUNT(DISTINCT ti.itemName) as uniqueItems,
      SUM(ti.quantity) as totalSold,
      SUM(ti.itemPrice * ti.quantity) as totalRevenue,
      AVG(ti.itemPrice) as avgPrice,
      COUNT(DISTINCT t.id) as transactionCount
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    WHERE i.category IS NOT NULL
    GROUP BY i.category
    ORDER BY totalRevenue DESC
  `).all();
}

// Get top items per category
export function getTopItemsPerCategory(limitPerCategory = 3) {
  // Get all categories first
  const categories = db.prepare(`
    SELECT DISTINCT category
    FROM items
    WHERE category IS NOT NULL
  `).all();

  const result = {};
  
  categories.forEach(cat => {
    const topItems = db.prepare(`
      SELECT 
        ti.itemName,
        SUM(ti.quantity) as sold,
        SUM(ti.itemPrice * ti.quantity) as revenue
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transactionId
      JOIN items i ON ti.itemId = i.id
      WHERE i.category = ?
      GROUP BY ti.itemName
      ORDER BY sold DESC
      LIMIT ?
    `).all(cat.category, limitPerCategory);
    
    result[cat.category] = topItems;
  });
  
  return result;
}

// Get all cities with visitor counts (for ranking list)
export function getAllCitiesWithVisitors() {
  return db.prepare(`
    SELECT 
      CASE 
        WHEN e.location LIKE '%,%' THEN 
          TRIM(SUBSTR(e.location, INSTR(e.location, ',') + 1))
        ELSE 
          e.location
      END as city,
      COUNT(DISTINCT ev.userId) as visitorCount,
      COUNT(DISTINCT e.id) as eventCount,
      COALESCE((
        SELECT SUM(t2.totalPrice)
        FROM transactions t2
        JOIN transaction_items ti2 ON t2.id = ti2.transactionId
        JOIN items i2 ON ti2.itemId = i2.id
        JOIN stations s2 ON i2.locationId = s2.id
        WHERE s2.eventId = e.id
      ), 0) as totalRevenue
    FROM events e
    LEFT JOIN event_visitors ev ON e.id = ev.eventId
    WHERE e.location IS NOT NULL AND e.location != ''
    GROUP BY city
    ORDER BY visitorCount DESC
  `).all();
}


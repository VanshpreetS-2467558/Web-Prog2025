import { db } from "../../db.js";

// Get visitors today for an event (or all events if eventId is null)
export function getVisitorsToday(organizerId, eventId = null) {
  let query = `
    SELECT COUNT(DISTINCT ev.userId) as count
    FROM event_visitors ev
    JOIN events e ON ev.eventId = e.id
    WHERE e.organisatorid = ?
    AND DATE(ev.visitTime) = DATE('now')
  `;
  
  const params = [organizerId];
  
  if (eventId) {
    query += ` AND ev.eventId = ?`;
    params.push(eventId);
  }
  
  const result = db.prepare(query).get(...params);
  return result?.count || 0;
}

// Get visitors per hour today for an event (or all events)
export function getVisitorsPerHourToday(organizerId, eventId = null) {
  let query = `
    SELECT 
      strftime('%H:00', ev.visitTime) as hour,
      COUNT(DISTINCT ev.userId) as count
    FROM event_visitors ev
    JOIN events e ON ev.eventId = e.id
    WHERE e.organisatorid = ?
    AND DATE(ev.visitTime) = DATE('now')
  `;
  
  const params = [organizerId];
  
  if (eventId) {
    query += ` AND ev.eventId = ?`;
    params.push(eventId);
  }
  
  query += ` GROUP BY strftime('%H:00', ev.visitTime) ORDER BY hour`;
  
  return db.prepare(query).all(...params);
}

// Get total revenue for an event (or all events)
export function getTotalRevenue(organizerId, eventId = null) {
  let query = `
    SELECT COALESCE(SUM(t.totalPrice), 0) as total
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
  
  const result = db.prepare(query).get(...params);
  return result?.total || 0;
}

// Get total visitors for an event (or all events)
export function getTotalVisitors(organizerId, eventId = null) {
  let query = `
    SELECT COUNT(DISTINCT ev.userId) as count
    FROM event_visitors ev
    JOIN events e ON ev.eventId = e.id
    WHERE e.organisatorid = ?
  `;
  
  const params = [organizerId];
  
  if (eventId) {
    query += ` AND ev.eventId = ?`;
    params.push(eventId);
  }
  
  const result = db.prepare(query).get(...params);
  return result?.count || 0;
}

// Get popular items for an event (or all events)
export function getPopularItems(organizerId, eventId = null, limit = 5) {
  let query = `
    SELECT 
      ti.itemName,
      SUM(ti.quantity) as sold,
      SUM(ti.itemPrice * ti.quantity) as revenue
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
    GROUP BY ti.itemName
    ORDER BY sold DESC
    LIMIT ?
  `;
  
  params.push(limit);
  
  return db.prepare(query).all(...params);
}

// Get transactions per hour for an event (or all events) today
export function getTransactionsPerHourToday(organizerId, eventId = null) {
  let query = `
    SELECT 
      strftime('%H:00', t.date) as hour,
      COALESCE(SUM(t.totalPrice), 0) as revenue,
      COUNT(DISTINCT t.id) as count
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    JOIN stations s ON i.locationId = s.id
    JOIN events e ON s.eventId = e.id
    WHERE e.organisatorid = ?
    AND DATE(t.date) = DATE('now')
  `;
  
  const params = [organizerId];
  
  if (eventId) {
    query += ` AND e.id = ?`;
    params.push(eventId);
  }
  
  query += ` GROUP BY strftime('%H:00', t.date) ORDER BY hour`;
  
  return db.prepare(query).all(...params);
}

// Get event info (for timer display)
export function getEventInfo(organizerId, eventId = null) {
  if (eventId) {
    return db.prepare(`
      SELECT id, name, startDate, endDate
      FROM events
      WHERE id = ? AND organisatorid = ?
    `).get(eventId, organizerId);
  }
  
  // Get the most recent live event, or the most recent event
  const liveEvent = db.prepare(`
    SELECT id, name, startDate, endDate
    FROM events
    WHERE organisatorid = ?
    AND datetime(startDate) <= datetime('now')
    AND datetime(endDate) >= datetime('now')
    ORDER BY startDate DESC
    LIMIT 1
  `).get(organizerId);
  
  if (liveEvent) return liveEvent;
  
  // If no live event, get the most recent event
  return db.prepare(`
    SELECT id, name, startDate, endDate
    FROM events
    WHERE organisatorid = ?
    ORDER BY startDate DESC
    LIMIT 1
  `).get(organizerId);
}

// Get total items sold for an event (or all events)
export function getTotalItemsSold(organizerId, eventId = null) {
  let query = `
    SELECT COALESCE(SUM(ti.quantity), 0) as total
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
  
  const result = db.prepare(query).get(...params);
  return result?.total || 0;
}

// Get total transactions count for an event (or all events)
export function getTotalTransactions(organizerId, eventId = null) {
  let query = `
    SELECT COUNT(DISTINCT t.id) as count
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
  
  const result = db.prepare(query).get(...params);
  return result?.count || 0;
}


export function getStationRevenueByEmployee(employeeId) {
  const stationRow = db.prepare(`
    SELECT s.id
    FROM stations s
    JOIN employees emp ON s.id = emp.stationId
    WHERE emp.userId = ?
  `).get(employeeId);
  if(!stationRow) return 0;
  const revenueRow = db.prepare(`
    SELECT COALESCE(SUM(t.totalPrice), 0) as total
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transactionId
    JOIN items i ON ti.itemId = i.id
    WHERE i.locationId = ?
  `).get(stationRow.id);

  return revenueRow?.total || 0;
}

export function getEventInfoByEmployee(employeeId) {
  const eventRow = db.prepare(`
    SELECT e.id, e.startDate, e.endDate
    FROM events e
    JOIN stations s ON e.id = s.eventId
    JOIN employees emp ON s.id = emp.stationId
    WHERE emp.userId = ?
    AND datetime(e.startDate) <= datetime('now')
    AND datetime(e.endDate) >= datetime('now')
    ORDER BY e.startDate DESC
    LIMIT 1
  `).get(employeeId);

  if(!eventRow) return null;
  return{
    id: eventRow.id,
    startDate: eventRow.startDate,
    endDate: eventRow.endDate
  }
}

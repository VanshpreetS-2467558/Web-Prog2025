import { db } from "../db.js";
import crypto from "crypto";



// geeft een user terug door email
export function getUserByEmail(email){
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
}

// boolean of email bestaat
export function emailExists(email){
    return !!getUserByEmail(email);
}

export function getUserById(id){
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function idExists(id){
    return !!getUserById(id);
}

// maakt user aan
export function createUser({role, name, email, phone, password, festCoins}){
    return db.prepare(`
        INSERT INTO users (role, name, email, phone, password, festCoins) 
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(role, name, email.trim().toLowerCase(), phone, password, festCoins);
}


// update de hoeveelheid coins
export function updateCoins({ value, user }) {
    try {
        db.prepare(`
            UPDATE users
            SET festCoins = festCoins + ?
            WHERE id = ?
        `).run(value, user.id);

        const row = db.prepare("SELECT festCoins FROM users WHERE id = ?").get(user.id);
        return row.festCoins;

    } catch (err) {
        console.error(err);
        return false;
    }
}

export function transferCoins({fromUser, toUser, amount}){
    try{
        
        db.prepare('BEGIN TRANSACTION').run();

        const fromResult = updateCoins({value: -amount, user: fromUser});
        if(fromResult ===false) throw new Error("Niet genoeg FestCoins of update mislukt.");

        const toResult = updateCoins({ value: amount, user: toUser, db });
        if (toResult === false) throw new Error("Update ontvanger mislukt"); 

        db.prepare('COMMIT').run();
        return {success: true, newAmount: fromResult};

    } catch{

        db.prepare('ROLLBACK').run();
        console.error(err);
        return {success: false};
    }
}

// returnt hashed wachtwoord op basis van id
export function getPasswordById(id){
    try{
        const password = db.prepare('SELECT password FROM users WHERE id == ?').get(id);
        if (!password) throw new Error ("Account bestaat niet.");

        return {success: true, password: password.password};

    } catch (err) {
        console.error(err);
        return {success: false, err};
    }
}


// past wachtwoord aan op basis van id
export function changePasswordById(id, password){
    try{
        db.prepare(`
            UPDATE users
            SET password = ?
            WHERE id = ?
            `).run(password, id);
        return {success: true}

    } catch (err) {
        console.error(err);
        return {success: false, err};
    }
}


// past naam aan op basis van id
export function updateNameById(id, name){
    try{
        db.prepare(`
        UPDATE users
        SET name = ?
        WHERE id = ?
        `).run(name, id);
        return {success: true}
    } catch (err) {
        console.error(err);
        return {success: false, err};
    }
}


export function deleteUserById(id) {
    try {
        db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, err };
    }
}

// past wachtwoord aan op basis van email
export function changePasswordByEmail(email, password){
    try{
        db.prepare(`
            UPDATE users
            SET password = ?
            WHERE email = ?
            `).run(password, email);
        return {success: true}

    } catch (err) {
        console.error(err);
        return {success: false, err};
    }
}

// checken of event naam al in gebruik is
export function checkNameEvent(name){
    return !!db.prepare("SELECT id FROM events WHERE LOWER(name) = LOWER(?)").get(name);
}

// create event
export function createEvent({ organisatorid, name, location, description, startDate, endDate }){
    return db.prepare(`
            INSERT INTO events (organisatorid, name, location, description, startDate, endDate)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(organisatorid, name, location, description || "", startDate, endDate);
}

// delete event 
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
        
        // 5. Get stations for this event to delete items
        const stations = db.prepare(`SELECT id FROM stations WHERE eventId = ?`).all(id);
        
        // 6. Delete items in these stations (transaction_items has ON DELETE SET NULL, so safe)
        stations.forEach(station => {
            db.prepare(`DELETE FROM items WHERE locationId = ?`).run(station.id);
        });
        
        // 7. Delete stations (references eventId)
        db.prepare(`DELETE FROM stations WHERE eventId = ?`).run(id);
        
        // 8. Finally delete the event
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


export function deleteItem(id){
    try{
        const result = db.prepare(`
            DELETE FROM items 
            WHERE id = ?
        `).run(id);
        if(result.changes === 0) {
            return { success: false, error: "Item niet gevonden" };
        }
        return { success: true };
    } catch(err){
        console.error(err);
        return { success: false, error: "Internal server error" };
    }
}

export function deleteLocation(id){
    try{
        // ON CASCADE DELETE should handle items automatically
        // But we need to delete employees first since they reference stationId
        db.prepare("BEGIN TRANSACTION").run();
        
        // Delete employees that reference this station
        db.prepare(`DELETE FROM employees WHERE stationId = ?`).run(id);
        
        // Now delete the station - CASCADE will handle items (ON DELETE CASCADE from stations)
        const result = db.prepare(`DELETE FROM stations WHERE id = ?`).run(id);
        
        db.prepare("COMMIT").run();
        
        if(result.changes === 0) {
            return { success: false, error: "Station niet gevonden" };
        }
        return { success: true };
    } catch(err){
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: "Internal server error" };
    }
}

export function searchEventById(eventId){
    return db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
}

export function searchStationByEventId(eventId){
    return db.prepare("SELECT * FROM stations WHERE eventId = ?").all(eventId);
}

export function searchItemsByStationId(stationId){
    return db.prepare("SELECT * FROM items WHERE locationId = ?").all(stationId)
}


export function updateEventById(eventId, updatedFields){
    const fields = [];
    const values = [];

    for (const key in updatedFields) {
        fields.push(`${key} = ?`);
        values.push(updatedFields[key]);
    }

    values.push(eventId);

    const sql = `UPDATE events SET ${fields.join(", ")} WHERE id = ?`;

    return db.prepare(sql).run(values);

}

// adds employee account into users and employees table
export function makeEmployeeAccount({name, password, eventId, stationId}){
    const result = db.prepare(`
    INSERT INTO users (role, name, email, phone, password, festCoins) 
    VALUES ('employee', ?, null, null, ?, null)
    `).run(name, password);
    const user = result.lastInsertRowid;
    return db.prepare('INSERT INTO employees (userId, eventId, stationId) VALUES (?, ?, ?)').run(user, eventId, stationId);
}

export function getEventsById(userId){
    return db.prepare(`
        SELECT id, name 
        FROM events 
        WHERE organisatorid = ?
    `).all(userId);
}

export function getStationsById(userId){
    return db.prepare(`
        SELECT s.id, s.name, s.eventId
        FROM stations s
        JOIN events e ON s.eventId = e.id
        WHERE e.organisatorid = ?
    `).all(userId);
}

export function getEmployeesByOrganisationId(orgId) {
    return db.prepare(`
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
    `).all(orgId);
}

export function getStationsWithoutEmployeesByOrganisationId(orgId) {
    return db.prepare(`
        SELECT s.id, s.name, s.eventId, e.name AS eventName
        FROM stations s
        JOIN events e ON s.eventId = e.id
        WHERE e.organisatorid = ?
        AND s.id NOT IN (
            SELECT stationId FROM employees
            JOIN events ev ON employees.eventId = ev.id
            WHERE ev.organisatorid = ?
        )
    `).all(orgId, orgId);
}

export function getUserTypeById(employeeId) { 
    const row = db.prepare("SELECT role FROM users WHERE id = ?").get(employeeId);
    return row.role;
}

export function getEmployeeStationNameById(userId) {
  // Join employees with stations to get the station name
  const stmt = db.prepare(`
    SELECT s.name AS stationName
    FROM employees e
    JOIN stations s ON e.stationId = s.id
    WHERE e.userId = ?
  `);

  const result = stmt.get(userId);

  if (!result) {
    return null; // no station found for this employee
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

export function getFestcoinsById(id){
    const row = db.prepare("SELECT festCoins FROM users WHERE id = ?").get(id);
    return row.festCoins;
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
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);
        const updateStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");

        itemsData.forEach(it => {
            insertItem.run(transactionId, it.id, it.name, it.price, it.qty);
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

export function searchExistingVisit(eventId, userId){
    return db.prepare(`
        SELECT id FROM event_visitors
        WHERE eventId = ? AND userId = ? AND leftAt IS NULL
    `).get(eventId, userId);
}

export function makeVisit(eventId, userId){
    return db.prepare(`
        INSERT INTO event_visitors (eventId, userId)
        VALUES (?, ?)
    `).run(eventId, userId);
}

export function closeVisit(eventId, userId){
    return db.prepare(`
        UPDATE event_visitors
        SET leftAt = CURRENT_TIMESTAMP
        WHERE eventId = ? AND userId = ? AND leftAt IS NULL
        ORDER BY visitTime DESC
        LIMIT 1
    `).run(eventId, userId);
}

export function updateVisitHeartbeat(eventId, userId){
    // Update last heartbeat or create new visit
    const existing = searchExistingVisit(eventId, userId);
    if(existing){
        // Update last heartbeat
        db.prepare(`
            UPDATE event_visitors
            SET lastHeartbeat = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(existing.id);
        return existing.id;
    } else {
        // Create new visit
        const result = makeVisit(eventId, userId);
        return result.lastInsertRowid;
    }
}

export function getActiveVisitorsCount(eventId){
    // Get visitors with heartbeat in last 2 minutes
    return db.prepare(`
        SELECT COUNT(DISTINCT userId) as count
        FROM event_visitors
        WHERE eventId = ? 
        AND leftAt IS NULL
        AND (lastHeartbeat IS NULL OR datetime(lastHeartbeat, '+2 minutes') > datetime('now'))
    `).get(eventId)?.count || 0;
}

export function cleanupOldVisits(){
    // Clean up visits older than 2 minutes without heartbeat
    return db.prepare(`
        UPDATE event_visitors
        SET leftAt = CURRENT_TIMESTAMP
        WHERE leftAt IS NULL
        AND lastHeartbeat IS NOT NULL
        AND datetime(lastHeartbeat, '+2 minutes') < datetime('now')
    `).run();
}

// FestCoins transaction functions
export function createFestCoinsTransaction({userId, type, amount, relatedUserId, groepspotId, description}){
    try {
        return db.prepare(`
            INSERT INTO festcoins_transactions (userId, type, amount, relatedUserId, groepspotId, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, type, amount, relatedUserId || null, groepspotId || null, description || null);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export function getFestCoinsTransactions(userId, limit = null){
    try {
        const query = limit 
            ? `SELECT ft.*, u.name as relatedUserName 
               FROM festcoins_transactions ft
               LEFT JOIN users u ON ft.relatedUserId = u.id
               WHERE ft.userId = ? 
               ORDER BY ft.createdAt DESC LIMIT ?`
            : `SELECT ft.*, u.name as relatedUserName 
               FROM festcoins_transactions ft
               LEFT JOIN users u ON ft.relatedUserId = u.id
               WHERE ft.userId = ? 
               ORDER BY ft.createdAt DESC`;
        return limit 
            ? db.prepare(query).all(userId, limit)
            : db.prepare(query).all(userId);
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Groepspot functions
export function createGroepspot({creatorId, eventId, totalAmount, qrCode, items}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        const result = db.prepare(`
            INSERT INTO groepspot (creatorId, eventId, totalAmount, remainingAmount, qrCode, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `).run(creatorId, eventId, totalAmount, totalAmount, qrCode);

        const groepspotId = result.lastInsertRowid;

        // Insert items
        const insertItem = db.prepare(`
            INSERT INTO groepspot_items (groepspotId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);

        items.forEach(item => {
            insertItem.run(groepspotId, item.id, item.name, item.price, item.quantity);
        });

        db.prepare("COMMIT").run();
        return { success: true, groepspotId, qrCode };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function getGroepspotByQrCode(qrCode){
    return db.prepare(`
        SELECT * FROM groepspot WHERE qrCode = ?
    `).get(qrCode);
}

export function getGroepspotById(id){
    return db.prepare(`
        SELECT * FROM groepspot WHERE id = ?
    `).get(id);
}

export function addGroepspotContribution({groepspotId, contributorId, amount}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        // Check if groepspot exists and get current remaining
        const groepspot = getGroepspotById(groepspotId);
        if (!groepspot) throw new Error("Groepspot niet gevonden");
        if (groepspot.status !== 'pending') throw new Error("Groepspot is al afgehandeld");
        if (amount > groepspot.remainingAmount) throw new Error("Bijdrage is te groot");

        // Check if user has enough coins
        const balance = getFestcoinsById(contributorId);
        if (amount > balance) throw new Error("Niet genoeg FestCoins");

        // Add contribution
        const contributionResult = db.prepare(`
            INSERT INTO groepspot_contributions (groepspotId, contributorId, amount)
            VALUES (?, ?, ?)
        `).run(groepspotId, contributorId, amount);

        // Update remaining amount
        const newRemaining = groepspot.remainingAmount - amount;
        db.prepare(`
            UPDATE groepspot
            SET remainingAmount = ?
            WHERE id = ?
        `).run(newRemaining, groepspotId);

        db.prepare("COMMIT").run();
        return { success: true, remainingAmount: newRemaining, contributionId: contributionResult.lastInsertRowid };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function updateGroepspotContribution({contributionId, newAmount, userId}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        // Get contribution
        const contribution = db.prepare(`
            SELECT gc.*, g.remainingAmount, g.status, g.totalAmount
            FROM groepspot_contributions gc
            JOIN groepspot g ON gc.groepspotId = g.id
            WHERE gc.id = ? AND gc.contributorId = ?
        `).get(contributionId, userId);

        if (!contribution) throw new Error("Bijdrage niet gevonden");
        if (contribution.status !== 'pending') throw new Error("Groepspot is al afgehandeld");

        const oldAmount = contribution.amount;
        const difference = newAmount - oldAmount;

        // Check if new amount is valid
        if (newAmount < 0) throw new Error("Bijdrage kan niet negatief zijn");
        if (newAmount > contribution.remainingAmount + oldAmount) {
            throw new Error(`Maximum bijdrage is ${contribution.remainingAmount + oldAmount} FestCoins`);
        }

        // Check balance if increasing
        if (difference > 0) {
            const balance = getFestcoinsById(userId);
            if (difference > balance) throw new Error("Niet genoeg FestCoins");
        }

        // Update contribution
        db.prepare(`
            UPDATE groepspot_contributions
            SET amount = ?
            WHERE id = ?
        `).run(newAmount, contributionId);

        // Update remaining amount
        const newRemaining = contribution.remainingAmount + oldAmount - newAmount;
        db.prepare(`
            UPDATE groepspot
            SET remainingAmount = ?
            WHERE id = ?
        `).run(newRemaining, contribution.groepspotId);

        db.prepare("COMMIT").run();
        return { success: true, remainingAmount: newRemaining };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function deleteGroepspotContribution({contributionId, userId}){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        // Get contribution
        const contribution = db.prepare(`
            SELECT gc.*, g.remainingAmount, g.status
            FROM groepspot_contributions gc
            JOIN groepspot g ON gc.groepspotId = g.id
            WHERE gc.id = ? AND gc.contributorId = ?
        `).get(contributionId, userId);

        if (!contribution) throw new Error("Bijdrage niet gevonden");
        if (contribution.status !== 'pending') throw new Error("Groepspot is al afgehandeld");

        // Delete contribution
        db.prepare(`
            DELETE FROM groepspot_contributions
            WHERE id = ?
        `).run(contributionId);

        // Update remaining amount
        const newRemaining = contribution.remainingAmount + contribution.amount;
        db.prepare(`
            UPDATE groepspot
            SET remainingAmount = ?
            WHERE id = ?
        `).run(newRemaining, contribution.groepspotId);

        db.prepare("COMMIT").run();
        return { success: true, remainingAmount: newRemaining };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

export function getCreatorContribution(groepspotId, creatorId){
    return db.prepare(`
        SELECT * FROM groepspot_contributions
        WHERE groepspotId = ? AND contributorId = ?
    `).get(groepspotId, creatorId);
}

export function getGroepspotContributions(groepspotId){
    return db.prepare(`
        SELECT gc.*, u.name as contributorName, gc.contributorId
        FROM groepspot_contributions gc
        LEFT JOIN users u ON gc.contributorId = u.id
        WHERE gc.groepspotId = ?
        ORDER BY gc.createdAt ASC
    `).all(groepspotId);
}

export function getGroepspotItems(groepspotId){
    return db.prepare(`
        SELECT * FROM groepspot_items
        WHERE groepspotId = ?
    `).all(groepspotId);
}

export function finalizeGroepspot(groepspotId){
    try {
        db.prepare("BEGIN TRANSACTION").run();

        const groepspot = getGroepspotById(groepspotId);
        if (!groepspot) throw new Error("Groepspot niet gevonden");
        if (groepspot.remainingAmount > 0) throw new Error("Nog niet volledig betaald");
        if (groepspot.status !== 'pending') throw new Error("Groepspot is al afgehandeld");

        // Get all contributions
        const contributions = getGroepspotContributions(groepspotId);

        // Deduct coins from all contributors
        contributions.forEach(contrib => {
            const result = updateCoins({ value: -contrib.amount, user: { id: contrib.contributorId } });
            if (result === false) throw new Error(`Kon niet betalen voor gebruiker ${contrib.contributorId}`);
        });

        // Create transaction
        const transactionResult = db.prepare(`
            INSERT INTO transactions (bezoekerId, totalPrice) VALUES (?, ?)
        `).run(groepspot.creatorId, groepspot.totalAmount);

        const transactionId = transactionResult.lastInsertRowid;

        // Get items and add to transaction
        const items = db.prepare(`
            SELECT * FROM groepspot_items WHERE groepspotId = ?
        `).all(groepspotId);

        const insertItem = db.prepare(`
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);
        const updateStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");

        items.forEach(item => {
            insertItem.run(transactionId, item.itemId, item.itemName, item.itemPrice, item.quantity);
            updateStock.run(item.quantity, item.itemId);
        });

        // Update groepspot status
        db.prepare(`
            UPDATE groepspot SET status = 'completed' WHERE id = ?
        `).run(groepspotId);

        // Add points to creator (1 FestCoin = 1 point)
        addUserPoints(groepspot.creatorId, groepspot.totalAmount);

        db.prepare("COMMIT").run();
        return { success: true, transactionId };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}

// ========== BUDGET ALARM FUNCTIONS ==========

// Get all budget alarms for a user
export function getBudgetAlarms(userId) {
    return db.prepare(`
        SELECT * FROM budget_alarms 
        WHERE userId = ? 
        ORDER BY category ASC
    `).all(userId);
}

// Get active budget alarms for a user
export function getActiveBudgetAlarms(userId) {
    return db.prepare(`
        SELECT * FROM budget_alarms 
        WHERE userId = ? AND isActive = 1
        ORDER BY category ASC
    `).all(userId);
}

// Get budget alarm by user and category
export function getBudgetAlarmByCategory(userId, category) {
    return db.prepare(`
        SELECT * FROM budget_alarms 
        WHERE userId = ? AND category = ?
    `).get(userId, category);
}

// Create or update budget alarm
export function upsertBudgetAlarm(userId, category, budgetLimit, resetSpending = false) {
    try {
        // Add resetDate column if it doesn't exist (migration)
        try {
            db.prepare(`ALTER TABLE budget_alarms ADD COLUMN resetDate TEXT DEFAULT NULL`).run();
        } catch (err) {
            // Column already exists, ignore error
        }

        const existing = getBudgetAlarmByCategory(userId, category);
        if (existing) {
            // If resetSpending is true, set resetDate to now
            const resetDate = resetSpending ? new Date().toISOString() : existing.resetDate;
            db.prepare(`
                UPDATE budget_alarms 
                SET budgetLimit = ?, isActive = 1, resetDate = ?
                WHERE userId = ? AND category = ?
            `).run(budgetLimit, resetDate, userId, category);
            return { success: true, id: existing.id };
        } else {
            const result = db.prepare(`
                INSERT INTO budget_alarms (userId, category, budgetLimit, isActive, resetDate)
                VALUES (?, ?, ?, 1, NULL)
            `).run(userId, category, budgetLimit);
            return { success: true, id: result.lastInsertRowid };
        }
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Delete budget alarm
export function deleteBudgetAlarm(userId, alarmId) {
    try {
        const result = db.prepare(`
            DELETE FROM budget_alarms 
            WHERE id = ? AND userId = ?
        `).run(alarmId, userId);
        return { success: true, deleted: result.changes > 0 };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Toggle budget alarm active status
export function toggleBudgetAlarm(userId, alarmId) {
    try {
        const alarm = db.prepare(`
            SELECT isActive FROM budget_alarms 
            WHERE id = ? AND userId = ?
        `).get(alarmId, userId);
        
        if (!alarm) {
            return { success: false, error: "Alarm niet gevonden" };
        }

        const newStatus = alarm.isActive ? 0 : 1;
        db.prepare(`
            UPDATE budget_alarms 
            SET isActive = ?
            WHERE id = ? AND userId = ?
        `).run(newStatus, alarmId, userId);
        
        return { success: true, isActive: newStatus === 1 };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Calculate total spending per category for a user (from transactions)
// If resetDate is set in budget_alarms, only count transactions after that date
export function getCategorySpending(userId, category) {
    // Check if there's a resetDate for this category
    const alarm = getBudgetAlarmByCategory(userId, category);
    const resetDate = alarm?.resetDate;
    
    if (resetDate) {
        const result = db.prepare(`
            SELECT COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transactionId = t.id
            JOIN items i ON ti.itemId = i.id
            WHERE t.bezoekerId = ? AND i.category = ? AND datetime(t.date) > datetime(?)
        `).get(userId, category, resetDate);
        
        return result ? result.total : 0;
    } else {
        const result = db.prepare(`
            SELECT COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transactionId = t.id
            JOIN items i ON ti.itemId = i.id
            WHERE t.bezoekerId = ? AND i.category = ?
        `).get(userId, category);
        
        return result ? result.total : 0;
    }
}

// Check if budget limit is exceeded and return info for notification
export function checkBudgetLimits(userId, itemsDict) {
    const activeAlarms = getActiveBudgetAlarms(userId);
    if (activeAlarms.length === 0) {
        return { exceeded: false };
    }

    // Calculate spending per category from this transaction
    const categorySpending = {};
    for (const [itemId, qty] of Object.entries(itemsDict)) {
        const item = db.prepare("SELECT category, price FROM items WHERE id = ?").get(itemId);
        if (item) {
            const amount = item.price * qty;
            categorySpending[item.category] = (categorySpending[item.category] || 0) + amount;
        }
    }

    // Check each active alarm
    const exceededAlarms = [];
    for (const alarm of activeAlarms) {
        const currentSpending = getCategorySpending(userId, alarm.category);
        const newSpending = currentSpending + (categorySpending[alarm.category] || 0);
        
        if (newSpending > alarm.budgetLimit) {
            exceededAlarms.push({
                category: alarm.category,
                budgetLimit: alarm.budgetLimit,
                currentSpending: currentSpending,
                newSpending: newSpending
            });
        }
    }

    return {
        exceeded: exceededAlarms.length > 0,
        alarms: exceededAlarms
    };
}

// ========== DASHBOARD ANALYTICS FUNCTIONS ==========

// Get spending per category for a user
export function getSpendingPerCategory(userId) {
    try {
        const result = db.prepare(`
            SELECT 
                i.category,
                COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transaction_items ti
            JOIN transactions t ON ti.transactionId = t.id
            JOIN items i ON ti.itemId = i.id
            WHERE t.bezoekerId = ?
            GROUP BY i.category
        `).all(userId);
        
        // Ensure all categories are represented
        const categories = ['Drank', 'Eten', 'Others'];
        const categoryMap = {};
        result.forEach(row => {
            categoryMap[row.category] = row.total;
        });
        
        return categories.map(cat => ({
            category: cat,
            total: categoryMap[cat] || 0
        }));
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Get spending per event for a user (ordered by most recent visit)
export function getSpendingPerEvent(userId) {
    try {
        // Get transactions with event info via transaction_items -> items -> stations -> events
        // Order by most recent transaction date
        const result = db.prepare(`
            SELECT 
                e.id as eventId,
                e.name as eventName,
                COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total,
                COUNT(DISTINCT t.id) as transactionCount,
                MAX(t.date) as lastVisit
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            JOIN events e ON s.eventId = e.id
            WHERE t.bezoekerId = ?
            GROUP BY e.id, e.name
            ORDER BY lastVisit DESC
        `).all(userId);
        
        return result;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Get detailed spending for a specific event
export function getEventSpendingDetails(userId, eventId) {
    try {
        // Get event info
        const eventInfo = db.prepare(`
            SELECT id, name, description, location, startDate, endDate
            FROM events
            WHERE id = ?
        `).get(eventId);
        
        const transactions = db.prepare(`
            SELECT 
                t.id as transactionId,
                t.date,
                t.totalPrice,
                GROUP_CONCAT(ti.itemName || ' x' || ti.quantity, ', ') as items
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            WHERE t.bezoekerId = ? AND s.eventId = ?
            GROUP BY t.id
            ORDER BY t.date DESC
        `).all(userId, eventId);
        
        const total = db.prepare(`
            SELECT COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            WHERE t.bezoekerId = ? AND s.eventId = ?
        `).get(userId, eventId);
        
        const categoryBreakdown = db.prepare(`
            SELECT 
                i.category,
                COALESCE(SUM(ti.itemPrice * ti.quantity), 0) as total
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transactionId
            JOIN items i ON ti.itemId = i.id
            JOIN stations s ON i.locationId = s.id
            WHERE t.bezoekerId = ? AND s.eventId = ?
            GROUP BY i.category
        `).all(userId, eventId);
        
        return {
            eventInfo: eventInfo || null,
            total: total?.total || 0,
            transactions: transactions,
            categoryBreakdown: categoryBreakdown
        };
    } catch (err) {
        console.error(err);
        return { eventInfo: null, total: 0, transactions: [], categoryBreakdown: [] };
    }
}

// Get spending today
export function getSpendingToday(userId) {
    try {
        const result = db.prepare(`
            SELECT COALESCE(SUM(totalPrice), 0) as total
            FROM transactions
            WHERE bezoekerId = ? AND date(date) = date('now')
        `).get(userId);
        
        return result?.total || 0;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

// Get total spending (all time)
export function getTotalSpending(userId) {
    try {
        const result = db.prepare(`
            SELECT COALESCE(SUM(totalPrice), 0) as total
            FROM transactions
            WHERE bezoekerId = ?
        `).get(userId);
        
        return result?.total || 0;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

// Get user transactions with full details (items, event, etc.)
export function getUserTransactions(userId, limit = null) {
    try {
        // First get all transactions
        const transactionsQuery = limit 
            ? `SELECT id, date, totalPrice FROM transactions WHERE bezoekerId = ? ORDER BY date DESC LIMIT ?`
            : `SELECT id, date, totalPrice FROM transactions WHERE bezoekerId = ? ORDER BY date DESC`;
        
        const transactions = limit 
            ? db.prepare(transactionsQuery).all(userId, limit)
            : db.prepare(transactionsQuery).all(userId);
        
        // Then enrich each transaction with items and event info
        const enrichedTransactions = transactions.map(trans => {
            // Check if this is a groepspot transaction by checking if items match a groepspot
            const groepspotCheck = db.prepare(`
                SELECT g.id, g.eventId, g.totalAmount, g.createdAt, e.name as eventName
                FROM groepspot g
                LEFT JOIN events e ON g.eventId = e.id
                WHERE g.creatorId = ? AND g.status = 'completed'
                AND g.totalAmount = ?
                AND EXISTS (
                    SELECT 1 FROM transactions t
                    WHERE t.id = ? AND t.bezoekerId = g.creatorId
                )
                ORDER BY g.createdAt DESC
                LIMIT 1
            `).get(userId, trans.totalPrice, trans.id);
            
            if (groepspotCheck) {
                // This is a groepspot transaction
                const groepspotId = groepspotCheck.id;
                const contributions = getGroepspotContributions(groepspotId);
                const items = getGroepspotItems(groepspotId);
                
                // Get station info from items
                const stationInfo = items.length > 0 ? db.prepare(`
                    SELECT s.name as stationName, s.id as stationId
                    FROM items i
                    JOIN stations s ON i.locationId = s.id
                    WHERE i.id = ?
                `).get(items[0].itemId) : null;
                
                const itemsString = items.map(item => `${item.itemName} x${item.quantity}`).join(' | ');
                
                // Sum contributions per user
                const contributionsByUser = {};
                contributions.forEach(c => {
                    if (!contributionsByUser[c.contributorId]) {
                        contributionsByUser[c.contributorId] = {
                            contributorId: c.contributorId,
                            contributorName: c.contributorName || 'Onbekend',
                            amount: 0,
                            createdAt: c.createdAt
                        };
                    }
                    contributionsByUser[c.contributorId].amount += c.amount;
                });
                
                // Convert to array and sort by creation date
                const summedContributions = Object.values(contributionsByUser).sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                
                // Calculate total contribution for creator (sum all contributions from this user)
                const creatorContributionSum = contributions
                    .filter(c => c.contributorId === userId)
                    .reduce((sum, c) => sum + c.amount, 0);
                
                return {
                    ...trans,
                    isGroepspot: true,
                    groepspotId: groepspotId,
                    eventId: groepspotCheck.eventId,
                    eventName: groepspotCheck.eventName || 'Onbekend event',
                    stationName: stationInfo?.stationName || 'Onbekend station',
                    items: itemsString,
                    totalAmount: groepspotCheck.totalAmount,
                    contributions: summedContributions,
                    creatorContribution: creatorContributionSum
                };
            } else {
                // Regular transaction
                const items = db.prepare(`
                    SELECT 
                        ti.itemName,
                        ti.quantity,
                        ti.itemPrice,
                        i.category,
                        s.name as stationName,
                        s.eventId,
                        e.name as eventName
                    FROM transaction_items ti
                    LEFT JOIN items i ON ti.itemId = i.id
                    LEFT JOIN stations s ON i.locationId = s.id
                    LEFT JOIN events e ON s.eventId = e.id
                    WHERE ti.transactionId = ?
                `).all(trans.id);
                
                // Get unique event info (use first item's event)
                const eventInfo = items.length > 0 && items[0].eventId 
                    ? { eventId: items[0].eventId, eventName: items[0].eventName }
                    : { eventId: null, eventName: null };
                
                // Get unique station (use first item's station)
                const stationName = items.length > 0 ? items[0].stationName : null;
                
                // Create items string
                const itemsString = items.map(item => `${item.itemName} x${item.quantity}`).join(' | ');
                
                return {
                    ...trans,
                    isGroepspot: false,
                    eventId: eventInfo.eventId,
                    eventName: eventInfo.eventName,
                    stationName: stationName,
                    items: itemsString
                };
            }
        });
        
        return enrichedTransactions;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Get transaction details with all items (including groepspot details)
export function getTransactionDetails(transactionId, userId) {
    try {
        const transaction = db.prepare(`
            SELECT t.*
            FROM transactions t
            WHERE t.id = ? AND t.bezoekerId = ?
        `).get(transactionId, userId);
        
        if (!transaction) return null;
        
        // Check if this is a groepspot transaction
        const groepspot = db.prepare(`
            SELECT g.*, e.name as eventName, e.location as eventLocation
            FROM groepspot g
            LEFT JOIN events e ON g.eventId = e.id
            WHERE g.creatorId = ? AND g.status = 'completed'
            AND g.totalAmount = ?
            AND EXISTS (
                SELECT 1 FROM transactions t
                WHERE t.id = ? AND t.bezoekerId = g.creatorId
            )
            ORDER BY g.createdAt DESC
            LIMIT 1
        `).get(userId, transaction.totalPrice, transactionId);
        
        if (groepspot) {
            // Get groepspot details
            const contributions = getGroepspotContributions(groepspot.id);
            const items = getGroepspotItems(groepspot.id);
            
            // Get station info
            const stationInfo = items.length > 0 ? db.prepare(`
                SELECT s.name as stationName
                FROM items i
                JOIN stations s ON i.locationId = s.id
                WHERE i.id = ?
            `).get(items[0].itemId) : null;
            
            // Sum contributions per user
            const contributionsByUser = {};
            contributions.forEach(c => {
                if (!contributionsByUser[c.contributorId]) {
                    contributionsByUser[c.contributorId] = {
                        contributorId: c.contributorId,
                        contributorName: c.contributorName || 'Onbekend',
                        amount: 0,
                        createdAt: c.createdAt
                    };
                }
                contributionsByUser[c.contributorId].amount += c.amount;
            });
            
            // Convert to array and sort by creation date
            const summedContributions = Object.values(contributionsByUser).sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            // Calculate total contribution for creator
            const creatorTotalContribution = summedContributions
                .filter(c => c.contributorId === userId)
                .reduce((sum, c) => sum + c.amount, 0);
            
            return {
                ...transaction,
                isGroepspot: true,
                eventName: groepspot.eventName || 'Onbekend event',
                eventLocation: groepspot.eventLocation || null,
                groepspotDetails: {
                    eventName: groepspot.eventName || 'Onbekend event',
                    eventLocation: groepspot.eventLocation || null,
                    stationName: stationInfo?.stationName || 'Onbekend station',
                    totalAmount: groepspot.totalAmount,
                    creatorContribution: creatorTotalContribution,
                    contributions: summedContributions,
                    items: items
                }
            };
        } else {
            // Regular transaction
            const eventInfo = db.prepare(`
                SELECT DISTINCT e.id as eventId, e.name as eventName, e.location as eventLocation
                FROM transactions t
                JOIN transaction_items ti ON t.id = ti.transactionId
                JOIN items i ON ti.itemId = i.id
                JOIN stations s ON i.locationId = s.id
                JOIN events e ON s.eventId = e.id
                WHERE t.id = ?
                LIMIT 1
            `).get(transactionId);
            
            const items = db.prepare(`
                SELECT 
                    ti.*,
                    i.category,
                    s.name as stationName,
                    e.name as eventName,
                    e.location as eventLocation
                FROM transaction_items ti
                LEFT JOIN items i ON ti.itemId = i.id
                LEFT JOIN stations s ON i.locationId = s.id
                LEFT JOIN events e ON s.eventId = e.id
                WHERE ti.transactionId = ?
            `).all(transactionId);
            
            // Get event location from first item if not in eventInfo
            const eventLocation = eventInfo?.eventLocation || (items.length > 0 ? items[0].eventLocation : null);
            
            return {
                ...transaction,
                isGroepspot: false,
                eventId: eventInfo?.eventId || null,
                eventName: eventInfo?.eventName || 'Onbekend event',
                eventLocation: eventLocation,
                items: items
            };
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}

// ========== POINTS SYSTEM FUNCTIONS ==========

// Get user points
export function getUserPoints(userId) {
    try {
        let points = db.prepare(`
            SELECT * FROM user_points WHERE userId = ?
        `).get(userId);
        
        // Create record if doesn't exist
        if (!points) {
            db.prepare(`
                INSERT INTO user_points (userId, currentPoints, totalPointsEarned, totalRewardsClaimed)
                VALUES (?, 0, 0, 0)
            `).run(userId);
            points = db.prepare(`
                SELECT * FROM user_points WHERE userId = ?
            `).get(userId);
        }
        
        return points;
    } catch (err) {
        console.error(err);
        return { userId, currentPoints: 0, totalPointsEarned: 0, totalRewardsClaimed: 0 };
    }
}

// Add points to user (1 FestCoin = 1 point)
export function addUserPoints(userId, festCoinsSpent) {
    try {
        const points = getUserPoints(userId);
        const newPoints = points.currentPoints + festCoinsSpent;
        const newTotalEarned = points.totalPointsEarned + festCoinsSpent;
        
        db.prepare(`
            UPDATE user_points 
            SET currentPoints = ?, 
                totalPointsEarned = ?,
                lastUpdated = CURRENT_TIMESTAMP
            WHERE userId = ?
        `).run(newPoints, newTotalEarned, userId);
        
        return { success: true, newPoints, canClaimReward: newPoints >= 100 };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

// Claim reward (10 FestCoins when reaching 100 points)
export function claimPointsReward(userId) {
    try {
        const points = getUserPoints(userId);
        
        if (points.currentPoints < 100) {
            return { success: false, error: "Niet genoeg punten. Je hebt 100 punten nodig." };
        }
        
        db.prepare("BEGIN TRANSACTION").run();
        
        // Reset points (subtract 100)
        const newPoints = points.currentPoints - 100;
        const newRewardsClaimed = points.totalRewardsClaimed + 1;
        
        db.prepare(`
            UPDATE user_points 
            SET currentPoints = ?,
                totalRewardsClaimed = ?,
                lastUpdated = CURRENT_TIMESTAMP
            WHERE userId = ?
        `).run(newPoints, newRewardsClaimed, userId);
        
        // Add 10 FestCoins to user
        updateCoins({ value: 10, user: { id: userId } });
        
        // Create festcoins transaction for reward
        createFestCoinsTransaction({
            userId: userId,
            type: 'reward',
            amount: 10,
            description: 'FestSpark BONUS'
        });
        
        db.prepare("COMMIT").run();
        
        return { 
            success: true, 
            newPoints, 
            festCoinsAdded: 10,
            totalRewardsClaimed: newRewardsClaimed
        };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}
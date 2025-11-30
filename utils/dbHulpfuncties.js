import { db } from "../db.js";


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
        db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
        return {success: true};
    } catch (err) {
        console.error(err);
        return { success: false, err };
    }
}


export function deleteItem(id){
    try{
        db.prepare(`
            DELETE FROM items 
            WHERE id = ?
        `).run(id);
    } catch(err){
        console.error(err);
        return { success: false, err };
    }
}

export function deleteLocation(id){
    try{
        db.prepare(`DELETE FROM stations WHERE id = ?`).run(id);
        return { success: true };
    } catch(err){
        console.error(err);
        return { success: false, err };
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

        // 4. maak transactie
        const result = db.prepare(`
            INSERT INTO transactions (bezoekerId, totalPrice) VALUES (?, ?)
        `).run(userId, totalPrice);

        const transactionId = result.lastInsertRowid;

        // 5. voeg items toe + update stock
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

        return { success: true, totalPrice, items: itemsData };

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
            ? `SELECT * FROM festcoins_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`
            : `SELECT * FROM festcoins_transactions WHERE userId = ? ORDER BY createdAt DESC`;
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
        SELECT gc.*, u.name as contributorName
        FROM groepspot_contributions gc
        LEFT JOIN users u ON gc.contributorId = u.id
        WHERE gc.groepspotId = ?
        ORDER BY gc.createdAt ASC
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

        db.prepare("COMMIT").run();
        return { success: true, transactionId };
    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.error(err);
        return { success: false, error: err.message };
    }
}
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


// EXTRA NOG NIET GEBRUIKT!!

export function getItemPriceById(id){
    const row = db.prepare("SELECT price FROM items WHERE id = ?").get(id);
    return row.price;
}

export function getItemStockById(id){
    const row = db.prepare("SELECT stock FROM items WHERE id = ?").get(id);
    return row.stock
}

export function getItemNameById(id){
    const row = db.prepare("SELECT name FROM items WHERE id = ?").get(id);
    return row.name;
}

export function getFestcoinsById(id){
    const row = db.prepare("SELECT festCoins FROM users WHERE id = ?").get(id);
    return row.festCoins;
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

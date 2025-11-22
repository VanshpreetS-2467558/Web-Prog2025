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
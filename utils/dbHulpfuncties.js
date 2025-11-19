import { db } from "../db.js";


// geeft een user terug door email
export function getUserByEmail(email){
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
}

// boolean of email bestaat
export function emailExists(email){
    return !!getUserByEmail(email);
}

// maakt user aan
export function createUser({role, name, email, phone, password, FestCoins}){
    return db.prepare(`
        INSERT INTO users (role, name, email, phone, password, FestCoins) 
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(role, name, email.trim().toLowerCase(), phone, password, FestCoins);
}

// checkt of user id bestaat
export function checkUserId({id}){
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

// update de hoeveelheid coins
export function updateCoins({value, user}){
    const row = db.prepare("SELECT FestCoins FROM users WHERE id = ?").get(user.id);
    const current = Number(row.FestCoins) || 0; // fallback naar 0
    const updatedValue = current + Number(value);
    
    try {db.prepare("UPDATE users SET FestCoins = ? WHERE id = ?").run(updatedValue, user.id);
        return updatedValue;
    }
    catch (err){
        console.error(err);
        return false;
    }
}
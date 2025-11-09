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
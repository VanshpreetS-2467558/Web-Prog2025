import express from "express";
const authenticationRouter = express.Router();
import bcrypt from "bcrypt";
import { db } from "../db.js";


 

// uitlog post
authenticationRouter.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Er is iets misgegaan, probeer opnieuw.");
    }
    res.clearCookie('connect.sid');
    res.redirect("/home");
  });
});


// register POST
authenticationRouter.post("/register", async (req, res) => {
  const {role, name, email, phone, password, confirmPassword} = req.body;

  // check of alle velden zijn ingevuld
  if (!role || !name || !email || !phone || !password || !confirmPassword)
    return res.json({ success: false, error: "Vul alle velden in!" });

  // Email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.json({ success: false, error: "Ongeldig e-mailadres" });

  // Telefoon check (mag simpeler)
  if (!/^\+?\d{8,15}$/.test(phone))
    return res.json({ success: false, error: "Ongeldig telefoonnummer" });

  // Wachtwoord (sterkte) check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password))
    return res.json({ success: false, error: "Wachtwoord is niet sterk genoeg" });

  // check of wachtwoord overeenkomt
  if (password !== confirmPassword)
    return res.json({success: false, error: "Wachtwoorden komen niet overeen!"});

  try {
    const hashedPass = await bcrypt.hash(password, 10);
    const FestCoins =  0;
    const cleanEmail = email.trim().toLowerCase();

    // check of email al bestaat
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (existing)
      return res.json({ success: false, error: "Er bestaat al een account met dit e-mailadres." });

    const newUser = db.prepare(`
      INSERT INTO users (role, name, email, phone, password, FestCoins) VALUES (?, ?, ?, ?, ?, ?)
    `).run(role, name, cleanEmail, phone, hashedPass, FestCoins);

    req.session.user = {id: newUser.lastInsertRowid, name, role, FestCoins , email: cleanEmail};
    res.json({success: true});
  } catch (err) {
    console.error(err);
    res.json({success: false, error: "Registreren mislukt! Probeer het later opnieuw."});
  }
});


// loging POST
authenticationRouter.post("/login", async (req, res) => {
  // vraagt gegevens van form html
  const { email, password } = req.body;

  // checkt of het een geldige email is
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    return res.json({success: false, error: "Geef een geldige email!"})
  }

  // haalt user data op door email , zo niet dan error
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());

  if (!user) {
    return res.json({ success: false, error: "Dit e-mailadres is nog niet in gebruik. Maak een nieuw account aan." });
  }

  // email checken
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json({ success: false, error: "Ongeldig e-mailadres" });
  }

  // kijkt of wachtwoord matched; anders weer error
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ success: false, error: "E-mail of wachtwoord is fout." });
  }
  // sessie opslaan en redirect
  req.session.user = { id: user.id, name: user.name, role: user.role , FestCoins: user.FestCoins, email: user.email};
  res.json({ success: true });
});




export default authenticationRouter;
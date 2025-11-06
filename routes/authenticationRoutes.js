import express from "express";
const authenticationRouter = express.Router();
import bcrypt from "bcrypt";
import { db } from "../db.js";





// GET-ROUTE voor uitloggen ? IPV POST MET FORM HTLM????????????????????????????????????????????????????????????????????????????????????????????????????
authenticationRouter.get("/logout", (req,res) => {
  req.session.destroy(err => {
    if(err){
      console.error(err);
      return res.status(500).send("kon niet uitleggen");
    }
    res.redirect("/home");
  })
})


// register POST
authenticationRouter.post("/register", async (req, res) => {
  const {role, name, email, phone, password, confirmPassword} = req.body;

  if (!email || !password)
    return res.json({success: false, error: "Email en wachtwoord verplicht!"});

  if (password !== confirmPassword)
    return res.json({success: false, error: "Wachtwoorden komen niet overeen!"});

  try {
    const hashedPass = await bcrypt.hash(password, 10);
    const festCoins = role === "bezoeker" ? 0 : null;
    const cleanEmail = email.trim().toLowerCase();

    const newUser = db.prepare(`
      INSERT INTO users (role, name, email, phone, password, FestCoins) VALUES (?, ?, ?, ?, ?, ?)
    `).run(role, name, cleanEmail, phone, hashedPass, festCoins);

    req.session.user = {id: newUser.lastInsertRowid, name, role, festCoins};
    res.json({success: true});
  } catch (err) {
    console.error(err);
    res.json({success: false, error: "Er bestaat al een account met dit e-mailadres."});
  }
});


// loging POST
authenticationRouter.post("/login", async (req, res) => {
  // vraagt gegevens van form html
  const { email, password } = req.body;

  // haalt user data op door email , zo niet dan error
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());

  if (!user) {
    return res.json({ success: false, error: "Dit e-mailadres is nog niet in gebruik. Maak een nieuw account aan." });
  }

  // kijkt of wachtwoord matched; anders weer error
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ success: false, error: "Wachtwoord is fout." });
  }
  // sessie opslaan en redirect
  req.session.user = { id: user.id, name: user.name, role: user.role , FestCoins: user.FestCoins };
  res.json({ success: true });
});




export default authenticationRouter;
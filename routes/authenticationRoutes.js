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
authenticationRouter.post("/register", async (req,res) => {
  // haalt gegevens op van form
  const {role, name, email, phone, password , confirmPassword} = req.body;
  
  // controle 
  if (!email || !password) return res.render("pages/registreren", {error: "Email en wachtwoord verplicht!"}); // wordt ook gecontroleerd bij html FORM
  if (password !== confirmPassword) return res.render("pages/registreren", {error: "Wachtwoorden komen niet overeen!"});

  // wachtwoord hashen
  const hashedPass = await bcrypt.hash(password, 10);

  // probeert het in database te stoppen
  try{
    // bezoekers krijgen 0 getal en org. krijgen null want moeten niet met festcoins werken
    const festCoins = role === "bezoeker" ? 0 : null;
    const cleanEmail = email.trim().toLowerCase();
    const newUser = db.prepare(`
      INSERT INTO users (role, name, email, phone, password, FestCoins) VALUES (?, ?, ?, ?, ?, ?)  
    `).run(role, name, cleanEmail, phone, hashedPass, festCoins);
    
    // maakt sessie aan voor gebruiker
    req.session.user = {id: newUser.lastInsertRowid, name, role , festCoins};
    res.redirect("/profiel");

  } catch (err){
    // Als email al bestaat
    console.error(err);
    res.render("pages/registreren" , {error: "Er bestaat al een account met dit e-mailadres."});
  }
})

// loging POST
authenticationRouter.post("/login", async (req, res) => {
  // vraagt gegevens van form html
  const { email, password } = req.body;

  // haalt user data op door email , zo niet dan error
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user) return res.render("pages/inloggen", { error: "Dit e-mailadres is nog niet in gebruik. Maak een nieuw account aan." });

  // kijkt of wachtwoord matched; anders weer error
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render("pages/inloggen", { error: "Email of wachtwoord is fout" });

  // sessie opslaan en redirect
  req.session.user = { id: user.id, name: user.name, role: user.role , FestCoins: user.FestCoins };
  res.redirect("/profiel");
});




export default authenticationRouter;
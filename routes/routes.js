import express from "express";
import { bezoeker_redenen, organisatoren_redenen, faq_home, faq_bezoekers, faq_org } from "../data/bezoekerVSorganisator.js";
const router = express.Router();
import bcrypt from "bcrypt";
import { db } from "../db.js"; 


// GET
router.get("/", (req, res) => res.redirect("/home"));
router.get("/home", (req, res) => {
  res.render("pages/index", { faq_home });
});
router.get("/over-ons", (request, response) => {
  response.render("pages/over-ons");
});
router.get("/bezoekers", (request, response) => {
  response.render("pages/bezoekers", {bezoeker_redenen, faq_bezoekers});
});
router.get("/organisatoren", (request, response) => {
  response.render("pages/organisatoren", {organisatoren_redenen, faq_org});
});
router.get("/klantenservice", (request, response) => {
  response.render("pages/klantenservice");
});
router.get("/inloggen", (request, response) => {
  response.render("pages/inloggen");
});
router.get("/privacy" , (request,response)=>{
  response.render("pages/privacy");
})
router.get("/voorwaarden" , (request,response)=>{
  response.render("pages/voorwaarden");
})
router.get("/cookiebeleid" , (request,response)=>{
  response.render("pages/cookie");
})
router.get("/registreren", (request,response)=>{
  response.render("pages/registreren");
})

// GET-ROUTE voor uitloggen ? IPV POST MET FORM HTLM? ??????????????????????????????????????????????????????????????????????????????????????????????????
router.get("/logout", (req,res) => {
  req.session.destroy(err => {
    if(err){
      console.error(err);
      return res.status(500).send("kon niet uitleggen");
    }
    res.redirect("/home");
  })
})


// register POST
router.post("/register", async (req,res) => {
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
    res.redirect("/home");

  } catch (err){
    // Als email al bestaat
    console.error(err);
    res.render("pages/registreren" , {error: "Er bestaat al een account met dit e-mailadres."});
  }
})

// loging POST
router.post("/login", async (req, res) => {
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
  res.redirect("/home");
});


export default router;

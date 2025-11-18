const express = require('express')
const router = express.router

// home page router

router.get("/", (request,response)=>{
  response.render("pages/registreren");
})

// register POST
router.post("/", async (req,res) => {
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

module.exports = router
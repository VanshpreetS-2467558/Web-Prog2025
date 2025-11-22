import express from "express";
import bcrypt from "bcrypt";
import { isValidEmail, isValidPhone, isStrongPassword, isPasswordCorrect } from "../utils/validatieHulpfuncties.js";
import { emailExists, getUserByEmail, createUser, getPasswordById, changePasswordById } from "../utils/dbHulpfuncties.js";


const authenticationRouter = express.Router();


// uitlog post
authenticationRouter.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Er is iets misgegaan, kon niet uitloggen.");
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

  // validatie checken
  if (!isValidEmail(email)) return res.json({success: false, error: "Ongeldig e-mailadres"});
  if (!isValidPhone(phone)) return res.json({success: false, error: "Ongeldig telefoonnummer"});
  if (!isStrongPassword(password)) return res.json({success: false, error: "Wachtwoord is niet sterk genoeg"});
  if (password !== confirmPassword) return res.json({success: false, error: "Wachtwoorden komen niet overeen"});
  if (emailExists(email)) return res.json({success: false, error: "Er bestaat al een account met dit e-mailadres"});

  try {
    const hashedPass = await bcrypt.hash(password, 10);
    const festCoins =  0;
    const newUser = createUser({role, name, email, phone, password: hashedPass, festCoins});
    req.session.user = {id: newUser.lastInsertRowid, name , role, festCoins, email};
    res.json({success: true});
  } catch (err) {
    console.error(err);
    res.json({success: false, error: "Registreren mislukt! Probeer het later opnieuw."});
  }
});


// login POST
authenticationRouter.post("/login", async (req, res) => {

  // vraagt gegevens van form html
  const { email, password } = req.body;

  // checkt of het een geldige email is
  if (!isValidEmail(email)) return res.json({ success: false, error: "Ongeldig e-mailadres" });

  // haalt user data op door email
  const user = getUserByEmail(email);
  if (!user) return res.json({ success: false, error: "Dit e-mailadres is nog niet in gebruik. Maak een nieuw account aan." });
  
  // kijkt of wachtwoord matched; anders weer error
  const match = await isPasswordCorrect(password, user.password);
  if (!match) return res.json({ success: false, error: "E-mail of wachtwoord is fout." });
  
  // sessie opslaan en redirect
  req.session.user = { id: user.id, name: user.name, role: user.role , festCoins: user.festCoins, email: user.email};
  res.json({ success: true });
});


// passwordChange POST
authenticationRouter.post("/passwordChange", async (req, res) => {
  const user = req.session.user;
  const {password, newPassword, confirmPassword} = req.body;
  const currentPasswordObject = (await getPasswordById(user.id));
  const currentPassword = currentPasswordObject.password;

  // check validity
  try  {
    if(newPassword != confirmPassword) return res.json({ success: false, error: "Wachtwoorden komen niet overeen."});
    if(!isStrongPassword(newPassword)) return res.json({ success: false, error: "Wachtwoord is niet sterk genoeg."});
    const match = await isPasswordCorrect(password, currentPassword);
    if(!match) return res.json({ success: false, error: "Wachtwoord incorrect."});

    // update wachtwoord in database
    const hashedPass = await bcrypt.hash(newPassword, 10);
    await changePasswordById(user.id, hashedPass);
    return res.json({success: true});

  } 
  catch(err) {
    console.error(err);
    return res.json({success: false, error: "internal server error"});
  }
})

export default authenticationRouter;
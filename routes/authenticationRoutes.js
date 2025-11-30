import express from "express";
import bcrypt from "bcrypt";
import { isValidEmail, isValidPhone, isStrongPassword, isPasswordCorrect } from "../utils/validatieHulpfuncties.js";
import { emailExists, getUserByEmail, createUser, getPasswordById, changePasswordById, updateNameById, deleteUserById, changePasswordByEmail, makeEmployeeAccount} from "../utils/dbHulpfuncties.js";


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
  const {role, name, email, phone, password, confirmPassword, keepLoggedIn} = req.body;

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

    if(keepLoggedIn){
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dagen
    } else {
      req.session.cookie.maxAge = 1 * 60 * 60 * 1000; // 1 uur
    }

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
  const { email, password, keepLoggedIn } = req.body;

  // checkt of het een geldige email is
  if (!isValidEmail(email)) return res.json({ success: false, error: "Ongeldig e-mailadres" });

  // haalt user data op door email
  const user = getUserByEmail(email);
  if (!user) return res.json({ success: false, error: "Dit e-mailadres is nog niet in gebruik. Maak een nieuw account aan." });
  
  // kijkt of wachtwoord matched; anders weer error
  const match = await isPasswordCorrect(password, user.password);
  if (!match) return res.json({ success: false, error: "E-mail of wachtwoord is fout." });
  
  if(keepLoggedIn){
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dagen
  } else {
    req.session.cookie.maxAge = 1 * 60 * 60 * 1000; // 1 uur
  }
  
  // sessie opslaan en redirect
  req.session.user = { id: user.id, name: user.name, role: user.role , festCoins: user.festCoins, email: user.email};
  res.json({ success: true });  

});


// passwordChange POST
authenticationRouter.post("/passwordChange", async (req, res) => {
  const user = req.session.user;
  const {password, newPassword, confirmPassword} = req.body;
  const currentPasswordObject = (await getPasswordById(user.id));
  if (!currentPasswordObject || !currentPasswordObject.password) return res.json({success: false, error: "Account bestaat niet."});
  const currentPassword = currentPasswordObject.password;
  

  // check validity
  try  {
    if(newPassword !== confirmPassword) return res.json({ success: false, error: "Wachtwoorden komen niet overeen."});
    if(!isStrongPassword(newPassword)) return res.json({ success: false, error: "Wachtwoord is niet sterk genoeg."});
    const match = await isPasswordCorrect(password, currentPassword);
    if(!match) return res.json({ success: false, error: "Wachtwoord incorrect."});

    // update wachtwoord in database en check of het successvol is
    const hashedPass = await bcrypt.hash(newPassword, 10);
    const result = await changePasswordById(user.id, hashedPass);
    if (!(result.success)) return res.json({success: false, error: "internal server error"});
    return res.json({success: true});

  } 
  catch(err) {
    console.error(err);
    return res.json({success: false, error: "internal server error"});
  }
});


// nameChange POST
authenticationRouter.post("/nameChange", async (req, res) => {
  const {name} = req.body;
  const oldname = req.session.user.name;
  const id = req.session.user.id;

  try {
    // check of naam veranderd is
    if (oldname === name) return res.json({success: false, error: "Naam is niet veranderd."});

    // check of update successvol is
    const result = await updateNameById(id, name);
    if (!(result.success)) return res.json({success: false, error: "internal server error"});
    req.session.user.name = name;
    return res.json({success: true});
  } catch (err){
    console.error(err);
    return res.json({success: false, error: "internal server error"});
}
});


// deleteAccount POST
authenticationRouter.post("/deleteAccount", async (req, res) =>{
  try {
    // calls database function
    const result = await deleteUserById(req.session.user.id);
    // checks for success
    if (!result.success){
      console.log(result.err);
      return res.json({success: false, error: "internal server error"});
    }
    // if successfull log out and redirect to homepage
    req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.json({success: false, error:"Kon sessie niet vernietigen."});
    }
    res.clearCookie('connect.sid');
    return res.json({success: true});
  });

  } catch (err){
    console.log(err);
    return res.json({success: false, error: "internal server error"});
  }
});


// resetWachtwoord POST
authenticationRouter.post("/resetWachtwoord", async (req, res) =>{
  const {email, newPassword, confirmPassword} = req.body;

  try{
    if (!emailExists(email)) return res.json({success: false, error: "email bestaat niet"});
    if(newPassword !== confirmPassword) return res.json({ success: false, error: "Wachtwoorden komen niet overeen."});
    if(!isStrongPassword(newPassword)) return res.json({ success: false, error: "Wachtwoord is niet sterk genoeg."});
    const hashedPass = await bcrypt.hash(newPassword, 10);
    const result = await changePasswordByEmail(email, hashedPass);
    if (!(result.success)) return res.json({success: false, error: "internal server error"});
    return res.json({success: true});


  } catch (err){
    console.log(err);
    return res.json({success: false, error: "internal server error"});
  }
})


// newEmployee POST
authenticationRouter.post("/newEmployee", async (req, res) => {
  const { name, password, confirmPassword, eventId, stationId } = req.body;

  // veld validatie
  console.log("test" + name + " " + password + " " + confirmPassword + " " + eventId + " " + stationId);
  if (!name || !password || !confirmPassword || !eventId || !stationId) return res.json({ success: false, error: "Vul alle velden in!" });
 
  // wachtwoord validatie
  if (!isStrongPassword(password)) return res.json({ success: false, error: "Wachtwoord is niet sterk genoeg" });
  if (password !== confirmPassword) return res.json({ success: false, error: "Wachtwoorden komen niet overeen" });

  try {
    // hash wachtwoord
    const hashedPass = await bcrypt.hash(password, 10);

    // maak account aan
    makeEmployeeAccount({
      name,
      password: hashedPass,
      eventId,
      stationId
    });
    return res.json({ success: true });

  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: "internal server error" });
  }
});


export default authenticationRouter;
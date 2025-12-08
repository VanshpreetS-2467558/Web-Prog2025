import express, { response } from "express";
const router = express.Router();
import { bezoeker_redenen, organisatoren_redenen, faq_home, faq_bezoekers, faq_org , faq_all} from "../data/bezoekerVSorganisator.js";
import {bezoekerStappen, groepspotStappen, organisatorStappen} from "../data/hoeWerktHetData.js" 
import {requireLogin} from "../middleware/requireLogin.js";


// Home pagina
router.get("/", (req, res) => res.redirect("/home"));
router.get("/home", (req, res) => {
  res.render("pages/index", { faq_home });
});

// hoe werkt het pagina
router.get("/HoeWerktFestCoin", (request, response) => {
  const instructions = request.query.instructions || "bezoeker";
  response.render("pages/instructies", {instructions,bezoekerStappen, groepspotStappen, organisatorStappen});
});

// bezoeker pagina
router.get("/bezoekers", (request, response) => {
  response.render("pages/bezoekers", {bezoeker_redenen, faq_bezoekers});
});

// organisator pagina
router.get("/organisatoren", (request, response) => {
  response.render("pages/organisatoren", {organisatoren_redenen, faq_org});
});

// klantenservice pagina
router.get("/klantenservice", (request, response) => {
  response.render("pages/klantenservice", {faq_all});
});

// inlog pagina (enkel als er geen session is)
router.get("/inloggen", (request, response) => {
  if(!request.session.user) response.render("pages/inloggen"); else response.redirect("/dashboard");
});

// privacy
router.get("/privacy" , (request,response)=>{
  response.render("pages/privacy");
});

// voorwaarden pagina
router.get("/voorwaarden" , (request,response)=>{
  response.render("pages/voorwaarden");
});

// cookiebeleid pagina
router.get("/cookiebeleid" , (request,response)=>{
  response.render("pages/cookie");
});

// registratie pagina
router.get("/registreren", (request,response)=>{
  response.render("pages/registreren");
});

// profiel pagina
router.get("/profile", requireLogin() ,(request,response)=>{
  response.render("pages/profielSettings");
});

// wachtwoord vergeten pagina
router.get("/wachtwoord-vergeten", (request,response)=>{
  response.render("pages/wachtwoordVergeten");
});

// Workstation pagina (employee) voor scannen en werken
router.get("/workStation", requireLogin("employee") ,(request,response)=>{
  response.render("pages/workStation");
});

// wallet pagina (bezoeker)
router.get("/wallet", requireLogin("bezoeker") , async (request,response)=>{
  const { getFestCoinsTransactions } = await import("../utils/dbHulpfuncties.js");
  const transactions = getFestCoinsTransactions(request.session.user.id, 4);
  const tab = request.query.tab || "buy";
  response.render("pages/walletBeheer", { transactions, tab });
});

// employeeBeheer pagina
router.get("/werknemers", requireLogin("organisator"), (request, response) =>{
  response.render("pages/werknemers");
})


export default router;

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
  const zichtbaar = request.query.zichtbaar || "bezoeker";
  response.render("pages/instructies", {zichtbaar,bezoekerStappen, groepspotStappen, organisatorStappen});
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

// dashboard pagina
router.get("/dashboard", requireLogin() ,(request,response)=>{
  response.render("pages/dashboard");
});

// evenementen lijst pagina
router.get("/evenementen",requireLogin("bezoeker") ,(request,response)=>{
  response.render("pages/eventLijst");
});

// wallet pagina (bezoeker)
router.get("/wallet", requireLogin("bezoeker") ,(request,response)=>{
  response.render("pages/walletBeheer");
});

// event beheren pagina
router.get("/event-management",requireLogin("organisator") ,(request,response)=>{
  response.render("pages/orgEvent");
});

// profiel pagina
router.get("/profile", requireLogin() ,(request,response)=>{
  response.render("pages/profielSettings");
});



export default router;

import express from "express";
import { bezoeker_redenen, organisatoren_redenen, faq_home, faq_bezoekers, faq_org } from "../data/bezoekerVSorganisator.js";
const router = express.Router();


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


export default router;

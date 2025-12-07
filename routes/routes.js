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

// dashboard pagina
router.get("/dashboard", requireLogin() ,async (request,response)=>{
  try{
    if (request.session.user.role === "organisator") {
      const { getEventsById } = await import("../utils/db/events.js");
      const events = getEventsById(request.session.user.id);
      response.render("pages/dashboard", { events });

    } else if (request.session.user.role === "bezoeker") {
      const {
        getSpendingPerCategory,
        getSpendingPerEvent,
        getSpendingToday,
        getTotalSpending,
        getUserTransactions,
        getUserPoints
      } = await import("../utils/dbHulpfuncties.js");

      const categorySpending = getSpendingPerCategory(request.session.user.id);
      const eventSpending = getSpendingPerEvent(request.session.user.id);
      const todaySpending = getSpendingToday(request.session.user.id);
      const totalSpending = getTotalSpending(request.session.user.id);
      const recentTransactions = getUserTransactions(request.session.user.id, 3);
      const userPoints = getUserPoints(request.session.user.id);

      const dashboardData = {
        categorySpending,
        eventSpending,
        todaySpending,
        recentTransactions: getUserTransactions(request.session.user.id, 3)
      };

      response.render("pages/dashboard", {
        categorySpending,
        eventSpending,
        todaySpending,
        totalSpending,
        recentTransactions,
        userPoints
        });
    } else {
      response.render("pages/dashboard");
    }
  }catch(error) {
      console.error("Dashboard error:", error);
      response.status(500).render("error_pages/500");
  }
});

// wallet pagina (bezoeker)
router.get("/wallet", requireLogin("bezoeker") , async (request,response)=>{
  const { getFestCoinsTransactions } = await import("../utils/dbHulpfuncties.js");
  const transactions = getFestCoinsTransactions(request.session.user.id, 4);
  const tab = request.query.tab || "buy"; // Default to buy tab
  response.render("pages/walletBeheer", { transactions, tab });
});

// budget alarm pagina (bezoeker)
router.get("/budget-alarm", requireLogin("bezoeker"), async (request, response) => {
  const { getBudgetAlarms, getCategorySpending } = await import("../utils/dbHulpfuncties.js");
  const alarms = getBudgetAlarms(request.session.user.id);
  
  // Add current spending for each alarm
  const alarmsWithSpending = alarms.map(alarm => ({
    ...alarm,
    currentSpending: getCategorySpending(request.session.user.id, alarm.category)
  }));
  
  response.render("pages/budgetAlarm", { alarms: alarmsWithSpending });
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
router.get("/workStation", requireLogin() ,(request,response)=>{
  response.render("pages/workStation");
});

// employeeBeheer pagina
router.get("/werknemers", requireLogin("organisator"), (request, response) =>{
  response.render("pages/werknemers");
})


export default router;

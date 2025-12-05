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

// Get all transactions for dashboard
router.get("/dashboard/transactions", requireLogin("bezoeker"), async (request, response) => {
  const { getUserTransactions } = await import("../utils/dbHulpfuncties.js");
  const transactions = getUserTransactions(request.session.user.id);
  response.json({ success: true, transactions });
});


// Get event spending details
router.get("/dashboard/event/:eventId/details", requireLogin("bezoeker"), async (request, response) => {
  const { getEventSpendingDetails } = await import("../utils/dbHulpfuncties.js");
  const eventId = parseInt(request.params.eventId);
  const details = getEventSpendingDetails(request.session.user.id, eventId);
  response.json({ success: true, details });
});

// Get transaction details
router.get("/dashboard/transaction/:transactionId/details", requireLogin("bezoeker"), async (request, response) => {
  try {
    const { getTransactionDetails } = await import("../utils/dbHulpfuncties.js");
    const transactionId = parseInt(request.params.transactionId);
    const transaction = getTransactionDetails(transactionId, request.session.user.id);
    if (transaction) {
      response.json({ success: true, transaction });
    } else {
      response.json({ success: false, error: "Transactie niet gevonden" });
    }
  } catch (error) {
    console.error("Transaction details error:", error);
    response.json({ success: false, error: error.message });
  }
});

// Get dashboard data (for real-time updates) - visitor only
router.get("/dashboard/user-data", requireLogin("bezoeker"), async (request, response) => {
  try {
    const {
      getSpendingPerCategory,
      getSpendingPerEvent,
      getSpendingToday,
      getTotalSpending,
      getUserTransactions
    } = await import("../utils/dbHulpfuncties.js");
    
    const categorySpending = getSpendingPerCategory(request.session.user.id);
    const eventSpending = getSpendingPerEvent(request.session.user.id);
    const todaySpending = getSpendingToday(request.session.user.id);
    const totalSpending = getTotalSpending(request.session.user.id);
    const recentTransactions = getUserTransactions(request.session.user.id, 5);
    
    response.json({
      success: true,
      categorySpending,
      eventSpending,
      todaySpending,
      totalSpending,
      recentTransactions
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    response.json({ success: false, error: error.message });
  }
});

// Get user points
router.get("/dashboard/points", requireLogin("bezoeker"), async (request, response) => {
  const { getUserPoints } = await import("../utils/dbHulpfuncties.js");
  const points = getUserPoints(request.session.user.id);
  response.json({ success: true, points });
});

// Claim points reward
router.post("/dashboard/points/claim", requireLogin("bezoeker"), async (request, response) => {
  const { claimPointsReward, getUserById } = await import("../utils/dbHulpfuncties.js");
  const result = claimPointsReward(request.session.user.id);
  
  if (result.success) {
    // Update session FestCoins
    const user = getUserById(request.session.user.id);
    request.session.user.festCoins = user.festCoins;
    response.json(result);
  } else {
    response.json(result);
  }
});

// wallet pagina (bezoeker)
router.get("/wallet", requireLogin("bezoeker") , async (request,response)=>{
  const { getFestCoinsTransactions } = await import("../utils/dbHulpfuncties.js");
  const transactions = getFestCoinsTransactions(request.session.user.id, 4);
  response.render("pages/walletBeheer", { transactions });
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

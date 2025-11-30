import express from "express";
import { searchExistingVisit, makeVisit, searchEventById, searchStationByEventId, searchItemsByStationId, closeVisit, updateVisitHeartbeat, getActiveVisitorsCount, getUserById } from "../utils/dbHulpfuncties.js";
import {requireLogin} from "../middleware/requireLogin.js";

const eventListRouter = express.Router();


eventListRouter.get("/events/:id", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  // Update heartbeat (creates visit if doesn't exist)
  updateVisitHeartbeat(eventId, userId);

  // Haal event op
  const event = searchEventById(eventId);

  // Haal stations + items
  const stations = searchStationByEventId(eventId);
  stations.forEach(st => {
    st.items = searchItemsByStationId(st.id);
  });

  // Get updated user for festCoins
  const user = getUserById(userId);

  res.render("pages/eventShoppingList", { event, stations, user });
});

eventListRouter.post("/events/:id/leave", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  // Update meest recente bezoek dat nog open staat
  closeVisit(eventId, userId);

  // Eventueel cart resetten
  req.session.cart = [];
  res.redirect("/evenementen");
});

// Heartbeat endpoint
eventListRouter.post("/events/:id/heartbeat", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;
  
  updateVisitHeartbeat(eventId, userId);
  res.json({ success: true });
});

// Get active visitors count
eventListRouter.get("/events/:id/visitors", (req, res) => {
  const eventId = req.params.id;
  const count = getActiveVisitorsCount(eventId);
  res.json({ success: true, count });
});

// Get user festCoins
eventListRouter.get("/user/festcoins", requireLogin("bezoeker"), (req, res) => {
  const user = getUserById(req.session.user.id);
  res.json({ success: true, festCoins: user.festCoins });
});

// Get transactions
eventListRouter.get("/user/transactions", requireLogin("bezoeker"), async (req, res) => {
  const { getFestCoinsTransactions } = await import("../utils/dbHulpfuncties.js");
  const transactions = getFestCoinsTransactions(req.session.user.id, 4);
  res.json({ success: true, transactions });
});

// Get item stock
eventListRouter.get("/items/:id/stock", async (req, res) => {
  const itemId = req.params.id;
  const { db } = await import("../db.js");
  const item = db.prepare("SELECT stock FROM items WHERE id = ?").get(itemId);
  if(item){
    res.json({ success: true, stock: item.stock });
  } else {
    res.json({ success: false, error: "Item niet gevonden" });
  }
});

export default eventListRouter;
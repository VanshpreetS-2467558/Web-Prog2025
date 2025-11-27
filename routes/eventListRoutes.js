import express from "express";
import { db } from "../db.js";
import {requireLogin} from "../middleware/requireLogin.js";

const eventListRouter = express.Router();



eventListRouter.get("/events/:id", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  // voeg bezoeker toe
  db.prepare("INSERT INTO event_visitors (eventId, userId) VALUES (?, ?)").run(eventId, userId);

  // Haal event op
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);

  // Haal stations + items
  const stations = db.prepare("SELECT * FROM stations WHERE eventId = ?").all(eventId);
  stations.forEach(st => {
    st.items = db.prepare("SELECT * FROM items WHERE locationId = ?").all(st.id);
  });

  res.render("pages/eventShoppingList", { event, stations });
});

eventListRouter.post('/events/:id/leave', requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  db.prepare(`
    UPDATE event_visitors
    SET leftAt = CURRENT_TIMESTAMP
    WHERE eventId = ? AND userId = ? AND leftAt IS NULL
  `).run(eventId, userId);

  // eventueel cart resetten
  req.session.cart = [];
  res.redirect('/evenementen');
});




export default eventListRouter;
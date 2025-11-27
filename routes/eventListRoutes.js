import express from "express";
import { db } from "../db.js";
import {requireLogin} from "../middleware/requireLogin.js";

const eventListRouter = express.Router();


eventListRouter.get("/events/:id", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  
  const existingVisit = db.prepare(`
    SELECT id FROM event_visitors
    WHERE eventId = ? AND userId = ? AND leftAt IS NULL
  `).get(eventId, userId);

 
  if (!existingVisit) {
    db.prepare(`
      INSERT INTO event_visitors (eventId, userId)
      VALUES (?, ?)
    `).run(eventId, userId);
  }

  // Haal event op
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);

  // Haal stations + items
  const stations = db.prepare("SELECT * FROM stations WHERE eventId = ?").all(eventId);
  stations.forEach(st => {
    st.items = db.prepare("SELECT * FROM items WHERE locationId = ?").all(st.id);
  });

  res.render("pages/eventShoppingList", { event, stations });
});

eventListRouter.post("/events/:id/leave", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  // Update meest recente bezoek dat nog open staat
  db.prepare(`
    UPDATE event_visitors
    SET leftAt = CURRENT_TIMESTAMP
    WHERE eventId = ? AND userId = ? AND leftAt IS NULL
    ORDER BY visitTime DESC
    LIMIT 1
  `).run(eventId, userId);

  // Eventueel cart resetten
  req.session.cart = [];
  res.redirect("/evenementen");
});


export default eventListRouter;
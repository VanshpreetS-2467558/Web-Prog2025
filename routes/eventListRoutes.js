import express from "express";
import { db } from "../db.js";
import {requireLogin} from "../middleware/requireLogin.js";

const eventListRouter = express.Router();



eventListRouter.get("/events/:id", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;

  // Haal event op
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);

  // Haal stations + items
  const stations = db.prepare("SELECT * FROM stations WHERE eventId = ?").all(eventId);
  stations.forEach(st => {
    st.items = db.prepare("SELECT * FROM items WHERE locationId = ?").all(st.id);
  });

  res.render("pages/eventShoppingList", { event, stations });
});



export default eventListRouter;
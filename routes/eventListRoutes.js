import express from "express";
import { searchExistingVisit, makeVisit, searchEventById, searchStationByEventId, searchItemsByStationId, closeVisit } from "../utils/dbHulpfuncties.js";
import {requireLogin} from "../middleware/requireLogin.js";

const eventListRouter = express.Router();


eventListRouter.get("/events/:id", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  const existingVisit = searchExistingVisit(eventId, userId);
  if (!existingVisit) {
    makeVisit(eventId, userId);
  }

  // Haal event op
  const event = searchEventById(eventId);

  // Haal stations + items
  const stations = searchStationByEventId(eventId);
  stations.forEach(st => {
    st.items = searchItemsByStationId(st.id);
  });

  res.render("pages/eventShoppingList", { event, stations });
});

eventListRouter.post("/events/:id/leave", requireLogin("bezoeker"), (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  // Update meest recente bezoek dat nog open staat
  closeVisit(eventId, userId);

  // Eventueel cart resetten
  req.session.cart = [];
  res.redirect("/event/evenementen");
});


export default eventListRouter;
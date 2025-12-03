import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import {
  getVisitorsToday,
  getVisitorsPerHourToday,
  getTotalRevenue,
  getTotalVisitors,
  getPopularItems,
  getTransactionsPerHourToday,
  getEventInfo
} from "../utils/db/dashboard.js";

const dashboardRouter = express.Router();

// Get dashboard data for organizer
dashboardRouter.get("/data", requireLogin("organisator"), async (req, res) => {
  try {
    const organizerId = req.session.user.id;
    const eventId = req.query.eventId ? parseInt(req.query.eventId) : null;

    const visitorsToday = getVisitorsToday(organizerId, eventId);
    const visitorsPerHour = getVisitorsPerHourToday(organizerId, eventId);
    const totalRevenue = getTotalRevenue(organizerId, eventId);
    const totalVisitors = getTotalVisitors(organizerId, eventId);
    const popularItems = getPopularItems(organizerId, eventId);
    const transactionsPerHour = getTransactionsPerHourToday(organizerId, eventId);
    const eventInfo = getEventInfo(organizerId, eventId);

    res.json({
      success: true,
      data: {
        visitorsToday,
        visitorsPerHour,
        totalRevenue,
        totalVisitors,
        popularItems,
        transactionsPerHour,
        eventInfo
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "internal server error" });
  }
});

export default dashboardRouter;


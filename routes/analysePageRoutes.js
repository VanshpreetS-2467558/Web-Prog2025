import express from "express";
import {requireLogin} from "../middleware/requireLogin.js";
import {
    getTotalVisitorsAll,
    getTotalRevenueAll,
    getTotalItemsSoldAll,
    getTotalEventsCount,
    getTopCitiesByVisitors,
    getCategorySalesRevenue,
    getCategorySalesQuantity,
    getTopItemsBySales,
    getCategoryStatistics,
    getTopItemsPerCategory,
    getAllCitiesWithVisitors
} from "../utils/db/generalAnalysis.js";

const analyse = express.Router();

analyse.get("/algemene-analyse", requireLogin("organisator"), (req, res) => {
    res.render("pages/algemeneAnalyse");
});

// API endpoint to get general analysis data
analyse.get("/algemene-analyse/data", requireLogin("organisator"), async (req, res) => {
    try {
        const totalVisitors = getTotalVisitorsAll();
        const totalRevenue = getTotalRevenueAll();
        const totalItemsSold = getTotalItemsSoldAll();
        const eventsCount = getTotalEventsCount();
        const topCities = getTopCitiesByVisitors(10);
        const categoryRevenue = getCategorySalesRevenue();
        const categoryQuantity = getCategorySalesQuantity();
        const topItems = getTopItemsBySales(5);
        const categoryStats = getCategoryStatistics();
        const topItemsPerCategory = getTopItemsPerCategory(3);
        const allCities = getAllCitiesWithVisitors();

        res.json({
            success: true,
            data: {
                summary: {
                    totalVisitors,
                    totalRevenue,
                    totalItemsSold,
                    eventsCount
                },
                topCities,
                categoryRevenue,
                categoryQuantity,
                topItems,
                categoryStats,
                topItemsPerCategory,
                allCities
            }
        });
    } catch (err) {
        console.error("Error fetching general analysis data:", err);
        res.json({ success: false, error: "Internal server error" });
    }
});

export default analyse;
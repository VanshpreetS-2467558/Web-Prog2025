import express from "express";
import { makeTransaction, getTransactionAnalysis, getTotalSpent, getTopItemsBySpending, getTopStationsBySpending } from "../utils/db/transactions.js";

const transactionRouter = express.Router();

// transaction POST
transactionRouter.post("/transaction", async (req, res) => {
    const user = req.session.user;
    const itemsDict = req.body.items;

    try {
        const result = makeTransaction(user.id, itemsDict);
        if (!result.success) return res.json({ success: false, error: result.error });

        req.session.user.festCoins -= result.totalPrice;
        res.json({ success: true, newAmount: req.session.user.festCoins });
    } catch (err) {
        console.log(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// analysis GET
transactionRouter.get("/analysis/data", async (req, res) => {
    const user = req.session.user;
    const { startDate, endDate } = req.query;

    try {
        const analysisData = getTransactionAnalysis(user.id, startDate || null, endDate || null);
        const totalSpent = getTotalSpent(user.id, startDate || null, endDate || null);
        const topItems = getTopItemsBySpending(user.id, startDate || null, endDate || null);
        const topStations = getTopStationsBySpending(user.id, startDate || null, endDate || null);

        // Calculate total items and category breakdown
        let totalItems = 0;
        const categoryCounts = {};

        analysisData.forEach(row => {
            totalItems += row.quantity;
            const category = row.category || 'Onbekend';
            categoryCounts[category] = (categoryCounts[category] || 0) + row.quantity;
        });

        res.json({
            success: true,
            totalItems,
            totalSpent,
            categoryBreakdown: categoryCounts,
            topItems: topItems,
            topStations: topStations
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});


export default transactionRouter;

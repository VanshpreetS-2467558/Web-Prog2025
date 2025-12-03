import express from "express";
import { 
    makeTransaction,
    getRecentTransactionsForBezoeker,
    getAllTransactionsForBezoeker,
    getRecentTransactionsForOrganizer,
    getAllTransactionsForOrganizer,
    getRecentTransactionsForEmployee,
    getAllTransactionsForEmployee
} from "../utils/db/transactions.js";
import { requireLogin } from "../middleware/requireLogin.js";

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

// Get recent transactions (3 most recent)
transactionRouter.get("/recent", requireLogin(), async (req, res) => {
    try {
        const user = req.session.user;
        let transactions;

        if (user.role === "bezoeker") {
            transactions = getRecentTransactionsForBezoeker(user.id);
        } else if (user.role === "organisator") {
            const eventId = req.query.eventId ? parseInt(req.query.eventId) : null;
            transactions = getRecentTransactionsForOrganizer(user.id, eventId);
        } else if (user.role === "employee") {
            transactions = getRecentTransactionsForEmployee(user.id);
        } else {
            return res.json({ success: false, error: "Invalid role" });
        }

        res.json({ success: true, transactions });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Get all transactions
transactionRouter.get("/all", requireLogin(), async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.json({ success: false, error: "No user session" });
        }

        let transactions;

        if (user.role === "bezoeker") {
            transactions = getAllTransactionsForBezoeker(user.id);
        } else if (user.role === "organisator") {
            const eventId = req.query.eventId ? parseInt(req.query.eventId) : null;
            transactions = getAllTransactionsForOrganizer(user.id, eventId);
        } else if (user.role === "employee") {
            transactions = getAllTransactionsForEmployee(user.id);
        } else {
            return res.json({ success: false, error: "Invalid role" });
        }

        res.json({ success: true, transactions });
    } catch (err) {
        console.error("Error in /transactions/all:", err);
        res.json({ success: false, error: err.message || "internal server error" });
    }
});


export default transactionRouter;

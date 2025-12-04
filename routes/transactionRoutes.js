import express from "express";
import { makeTransaction, checkBudgetLimits } from "../utils/dbHulpfuncties.js";

const transactionRouter = express.Router();

// transaction POST
transactionRouter.post("/transaction", async (req, res) => {
    const user = req.session.user;
    const itemsDict = req.body.items;

    try {
        // Check budget limits before processing transaction
        const budgetCheck = checkBudgetLimits(user.id, itemsDict);
        
        const result = makeTransaction(user.id, itemsDict);
        if (!result.success) return res.json({ success: false, error: result.error });

        req.session.user.festCoins -= result.totalPrice;
        
        // Include budget check results in response
        res.json({ 
            success: true, 
            newAmount: req.session.user.festCoins,
            budgetExceeded: budgetCheck.exceeded,
            budgetAlarms: budgetCheck.alarms || [],
            transactionId: result.transactionId,
            stationId: result.stationId,
            stationName: result.stationName,
            qrCode: result.qrCode,
            orderCode: result.orderCode
        });
    } catch (err) {
        console.log(err);
        res.json({ success: false, error: "internal server error" });
    }
});


export default transactionRouter;

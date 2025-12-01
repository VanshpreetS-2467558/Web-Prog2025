import express from "express";
import { makeTransaction } from "../utils/db/transactions.js";

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


export default transactionRouter;

import express from "express";
import { getItemPriceById, getItemStockById, getItemNameById, getFestcoinsById, addTransaction, updateCoins } from "../utils/dbHulpfuncties.js";

const transactionRouter = express.Router();

// transaction POST
transactionRouter.post("/transaction", async (req, res) => {
    const userId = req.session.user.id;
    const itemsDict = req.body.items;
    let totalPrice = 0;
    
    try {
        // iterate over items and check availability
        for (const [itemId, itemAmount] of Object.entries(itemsDict)){
            const itemPrice = await getItemPriceById(itemId);
            const itemStock = await getItemStockById(itemId);
            if (itemAmount > itemStock) {
                const itemName = await getItemNameById(itemId);
                return res.json({success: false, error: ("Er is niet genoeg van het volgende product beschikbaar: " + itemName)});
            }
            totalPrice += itemPrice * itemAmount;
        }

        // check userbalance vs price of order
        const userBalance = await getFestcoinsById(userId);
        if (totalPrice > userBalance) return res.json({success: false, error: "U heeft te weinig festcoins."});

        // subtract festcoin and log orders
        await updateCoins((-1 * totalPrice), req.session.user);
        const orderTime = Date.now();
        console.log("Its currently: " + orderTime);
        for (const [itemId, itemAmount] of Object.entries(itemsDict)) {
            for (let i = 0; i < itemAmount; i++) addTransaction(userId, itemId, orderTime);
        }
        
        return res.json({success: true});

    // catch errors
    } catch (err) {
        console.log(err);
        return res.json({success: false, error: "internal server error"});
    }
});

export default transactionRouter;

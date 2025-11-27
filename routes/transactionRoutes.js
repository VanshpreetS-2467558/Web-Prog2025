import express from "express";
import { getItemPriceById, getItemStockById, getItemNameById, getFestcoinsById, addTransaction, updateCoins } from "../utils/dbHulpfuncties.js";

const transactionRouter = express.Router();

// transaction POST
transactionRouter.post("/transaction", async (req, res) => {
    const user = req.session.user;
    const itemsDict = req.body.items;
    let totalPrice = 0;
    
    try {
        // iterate over items and check availability
        for (const [itemId, itemAmount] of Object.entries(itemsDict)){
            const itemPrice = getItemPriceById(itemId);
            const itemStock = getItemStockById(itemId);
            if (itemAmount > itemStock) {
                const itemName = getItemNameById(itemId);
                return res.json({success: false, error: ("Er is niet genoeg van het volgende product beschikbaar: " + itemName)});
            }
            totalPrice += itemPrice * itemAmount;
        }

        // check userbalance vs price of order
        const userBalance = getFestcoinsById(user.id);
        if (totalPrice > userBalance) return res.json({success: false, error: "U heeft te weinig festcoins."});

        // subtract festcoin and log orders
        const result = updateCoins({value: -totalPrice, user});
        if (result !== false){
            req.session.user.festCoins = result;
        }
        for (const [itemId, itemAmount] of Object.entries(itemsDict)) {
            for (let i = 0; i < itemAmount; i++) addTransaction(user.id, itemId);
        }
        
        return res.json({success: true, newAmount: req.session.user.festCoins});

    // catch errors
    } catch (err) {
        console.log(err);
        return res.json({success: false, error: "internal server error"});
    }
});

export default transactionRouter;

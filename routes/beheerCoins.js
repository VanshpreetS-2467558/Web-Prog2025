import express from "express";
import {updateCoins, idExists ,getUserById, transferCoins, createFestCoinsTransaction, getUserTypeById} from "../utils/dbHulpfuncties.js";
import {checkUserAndAmount} from "../utils/validatieHulpfuncties.js";

const beheerCoinsRouter = express.Router();

// add amount
beheerCoinsRouter.post("/addAmount", async (req, res) => {
    const {buyAmount} = req.body;
    const user = req.session.user;

    // check validity
    const errorCheck = checkUserAndAmount(user, buyAmount, 500);
    if(errorCheck) return res.json({ success: false, error });
    
    try {
        const result = updateCoins({value : buyAmount, user});
        if (result){
            req.session.user.festCoins = result;
            // Log transaction
            createFestCoinsTransaction({
                userId: user.id,
                type: 'buy',
                amount: buyAmount,
                description: `FestCoins gekocht: ${buyAmount}`
            });
            res.json({success: true, newAmount: req.session.user.festCoins});
        }
    } catch (err) {
        console.error(err);
        res.json({success: false, error: "Festcoins Updaten mislukt! Probeer het later opnieuw."});
    }
});

// sell amount
beheerCoinsRouter.post("/sellAmount", async (req, res) =>{
    const {sellAmount} = req.body;
    const user = req.session.user;

    // check validity
    const errorCheck = checkUserAndAmount(user, sellAmount, user?.festCoins);
    if(errorCheck) return res.json({ success: false, error });

    try{
        const result = updateCoins({value: -sellAmount, user});
        if (result !== false){
            req.session.user.festCoins = result;
            // Log transaction
            createFestCoinsTransaction({
                userId: user.id,
                type: 'sell',
                amount: -sellAmount,
                description: `FestCoins verkocht: ${sellAmount}`
            });
            res.json({success: true , newAmount: req.session.user.festCoins })
        }
    } catch(err){
        console.error(err);
        res.json({success: false, error: "Festcoins Updaten mislukt! Probeer het later opnieuw."});
    }
})

// share amount
beheerCoinsRouter.post("/shareAmount", async (req, res) =>{
    const {shareAmount, shareReceiver } = req.body;
    const user = req.session.user;
    const receiver = getUserById(shareReceiver);

    // check validity
    if(!shareAmount || !shareReceiver) return res.json({success: false, error: "Vul alle velden in!"});
    if(shareAmount <= 0) return res.json({success: false, error: "Geef een waarde groter dan nul in."});
    if((getUserTypeById(shareReceiver) !== "bezoeker") || (user.role !== "bezoeker")) return res.json({success: false, error: "Je kan Festcoin enkel tussen bezoekers sturen."});
    if(shareReceiver === user.id) return res.json({success: false, error: "Je kan geen FestCoins naar jezelf sturen."});
    if(!idExists(shareReceiver)) return res.json({success: false, error: "Er bestaat geen account met ID: " + shareReceiver});
    const errorCheck = checkUserAndAmount(user, shareAmount, user?.festCoins);
    if(errorCheck) return res.json({ success: false, error: errorCheck });

    try{
        const result = transferCoins({fromUser: user, toUser: receiver, amount: shareAmount});
        if (!result.success) return res.json({ success: false, error: "Festcoins versturen mislukt!" });
    
        req.session.user.festCoins = result.newAmount;
        
        // Log transactions for both users
        createFestCoinsTransaction({
            userId: user.id,
            type: 'send',
            amount: -shareAmount,
            relatedUserId: receiver.id,
            description: `FestCoins gestuurd naar ${receiver.name || receiver.email}`
        });
        createFestCoinsTransaction({
            userId: receiver.id,
            type: 'receive',
            amount: shareAmount,
            relatedUserId: user.id,
            description: `FestCoins ontvangen van ${user.name || user.email}`
        });
        
        res.json({success: true , newAmount: req.session.user.festCoins })
        
    } catch(err) {
        console.error(err);
        res.json({success: false, error: "Festcoins versturen mislukt! Probeer het later opnieuw."});
    }
})

// Get festcoins transactions GET
beheerCoinsRouter.get("/festcoins-transactions", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    try {
        const { getFestCoinsTransactions } = await import("../utils/dbHulpfuncties.js");
        const transactions = getFestCoinsTransactions(user.id);
        res.json({ success: true, transactions });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

export default beheerCoinsRouter;
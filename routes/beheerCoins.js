import express from "express";
import {updateCoins, idExists ,getUserById, transferCoins} from "../utils/dbHulpfuncties.js";

const beheerCoinsRouter = express.Router();


// add amount
beheerCoinsRouter.post("/addAmount", async (req, res) => {
    const {buyAmount} = req.body;
    const user = req.session.user;

    // check validity
    if (!user) return res.json({success: false, error: "Geen user ingelogd."});
    if (!buyAmount) return res.json({success: false, error: "Geen waarde meegegeven."});
    if (buyAmount <= 0) return res.json({success: false, error: "Waarde moet positief zijn."});
    if (buyAmount > 500) return res.json({success: false, error: "Max. 500 FestCoins per transactie toegestaan."});
    

    try {
        const result = updateCoins({value : buyAmount, user});
        if (result){
            req.session.user.festCoins = result;
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

    if (!user) return res.json({success: false, error: "Geen user ingelogd."});
    if (!sellAmount) return res.json({success: false, error: "Geen waarde meegegeven."});
    if (sellAmount <= 0) return res.json({success: false, error: "Waarde moet positief zijn."});
    if (sellAmount > user.festCoins) return res.json({success: false, error: "Ingevoerde aantal overschrijdt je huidige FestCoin saldo."});


    try{
        const result = updateCoins({value: -sellAmount, user});
        if (result !== false){
            req.session.user.festCoins = result;
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

    if (!user) return res.json({success: false, error: "Geen user ingelogd."});
    if(!shareAmount || !shareReceiver) return res.json({success: false, error: "Geef alle waardes mee."});
    if (shareAmount <= 0) return res.json({success: false, error: "Je kan geen negatieve waarde vesturen!"});
    if (shareAmount > user.festCoins) return res.json({success: false, error: "Ingevoerde aantal overschrijdt je huidige FestCoin saldo."});
    if(!idExists(shareReceiver)) return res.json({success: false, error: "Er bestaat geen account met ID: " + shareReceiver});

    try{
        const result = transferCoins({fromUser: user, toUser: receiver, amount: shareAmount});
        if (!result.success) return res.json({ success: false, error: "Festcoins versturen mislukt!" });
    
        req.session.user.festCoins = result.newAmount;
        res.json({success: true , newAmount: req.session.user.festCoins })
        
    } catch(err) {
        console.error(err);
        res.json({success: false, error: "Festcoins versturen mislukt! Probeer het later opnieuw."});
    }
})

export default beheerCoinsRouter;

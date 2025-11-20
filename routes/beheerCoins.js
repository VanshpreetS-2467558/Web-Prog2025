import express from "express";
import {updateCoins } from "../utils/dbHulpfuncties.js";

const beheerCoinsRouter = express.Router();

// Voeg coins toe

beheerCoinsRouter.get('/api/festCoins', (req, res) => {
    res.json({ festCoins: req.session.user?.festCoins || 0 });
});

beheerCoinsRouter.post("/addAmount", async (req, res) => {
    const {buyAmount} = req.body;
    const user = req.session.user;

    // check validity
    if (!buyAmount) return res.json({success: false, error: "Geen waarde meegegeven."});
    if (buyAmount <= 0) return res.json({success: false, error: "Waarde moet positief zijn."});
    if (buyAmount > 500) return res.json({succes: false, error: "Max. 500 FestCoins per transactie toegestaan."});
    if (!user) return res.json({success: false, error: "Geen user ingelogd."});

    try {
        const result = updateCoins({value : buyAmount, user});
        if (result){
            req.session.user.festCoins = result;
            res.json({success: true, newAmount: req.session.user.festCoins});
        }
    } 
    catch (err) {
        console.error(err);
        res.json({success: false, error: "Festcoins Updaten mislukt! Probeer het later opnieuw."});
    }
});

export default beheerCoinsRouter;

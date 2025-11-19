import express from "express";
import { checkUserId, updateCoins } from "../utils/dbHulpfuncties.js";

const beheerCoinsRouter = express.Router();

// Voeg coins toe

beheerCoinsRouter.post("/addAmount", async (req, res) => {
    const {buyAmount} = req.body;
    const user = req.session.user;

    // check validity
    if (!buyAmount) return res.json({success: false, error: "Geen waarde meegegeven."});
    if (buyAmount <= 0) return res.json({success: false, error: "Waarde moet positief zijn."});
    if (!user) return res.json({success: false, error: "Geen user ingelogd."});
    //if (!checkUserId({user : user.id})) return res.json({success: false, error: "Ongeldige user ID."});

    try {
        const result = updateCoins({value : buyAmount, user});
        if (result){
            res.json({success: true});
            req.session.user.festCoins = result;
        }
    } 
    catch (err) {
        console.error(err);
        res.json({success: false, error: "Festcoins Updaten mislukt! Probeer het later opnieuw."});
    }
});

export default beheerCoinsRouter;

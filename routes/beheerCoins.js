import express from "express";
import {updateCoins, idExists ,getUserById, transferCoins} from "../utils/dbHulpfuncties.js";
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
    if(shareReceiver === user.id) return res.json({success: false, error: "Je kan geen FestCoins naar jezelf sturen."});
    if(!idExists(shareReceiver)) return res.json({success: false, error: "Er bestaat geen account met ID: " + shareReceiver});
    const errorCheck = checkUserAndAmount(user, shareAmount, user?.festCoins);
    if(errorCheck) return res.json({ success: false, error });

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
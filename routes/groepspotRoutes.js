import express from "express";
import { 
    createGroepspot, 
    getGroepspotByQrCode, 
    getGroepspotById,
    addGroepspotContribution,
    getGroepspotContributions,
    finalizeGroepspot,
    getFestcoinsById,
    updateGroepspotContribution,
    deleteGroepspotContribution,
    getCreatorContribution,
    createFestCoinsTransaction,
    getUserById
} from "../utils/dbHulpfuncties.js";
import crypto from "crypto";

const groepspotRouter = express.Router();

// Create groepspot POST
groepspotRouter.post("/create", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    const { items, eventId } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, error: "Geen items opgegeven" });
    }

    try {
        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Generate unique QR code
        const qrCode = `GROEPSPOT_${crypto.randomBytes(16).toString('hex')}`;

        const result = createGroepspot({
            creatorId: user.id,
            eventId: eventId || null,
            totalAmount,
            qrCode,
            items
        });

        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        res.json({ 
            success: true, 
            groepspotId: result.groepspotId,
            qrCode: result.qrCode,
            totalAmount,
            remainingAmount: totalAmount
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Get groepspot by QR code GET
groepspotRouter.get("/qr/:qrCode", async (req, res) => {
    try {
        const groepspot = getGroepspotByQrCode(req.params.qrCode);
        if (!groepspot) {
            return res.json({ success: false, error: "Groepspot niet gevonden" });
        }

        res.json({
            success: true,
            groepspot
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Get groepspot status GET
groepspotRouter.get("/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    try {
        const groepspot = getGroepspotById(parseInt(req.params.id));
        if (!groepspot) {
            return res.json({ success: false, error: "Groepspot niet gevonden" });
        }

        // Only creator can view
        if (groepspot.creatorId !== user.id) {
            return res.json({ success: false, error: "Geen toegang" });
        }

        const contributions = getGroepspotContributions(groepspot.id);

        res.json({
            success: true,
            groepspot: {
                ...groepspot,
                contributions
            }
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Contribute to groepspot POST
groepspotRouter.post("/contribute", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    const { qrCode, amount } = req.body;

    if (!qrCode || !amount || amount <= 0) {
        return res.json({ success: false, error: "Ongeldige parameters" });
    }

    try {
        const groepspot = getGroepspotByQrCode(qrCode);
        if (!groepspot) {
            return res.json({ success: false, error: "QR-code niet gevonden" });
        }

        if (groepspot.status !== 'pending') {
            return res.json({ success: false, error: "Groepspot is al afgehandeld" });
        }

        // Check if user is trying to contribute to their own groepspot
        if (groepspot.creatorId === user.id) {
            return res.json({ success: false, error: "Je kan niet bijdragen aan je eigen groepspot" });
        }

        // Check balance
        const balance = getFestcoinsById(user.id);
        if (amount > balance) {
            return res.json({ success: false, error: "Niet genoeg FestCoins" });
        }

        // Check if amount exceeds remaining
        if (amount > groepspot.remainingAmount) {
            return res.json({ success: false, error: `Maximum bijdrage is ${groepspot.remainingAmount} FestCoins` });
        }

        const result = addGroepspotContribution({
            groepspotId: groepspot.id,
            contributorId: user.id,
            amount: parseInt(amount)
        });

        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        // Update session festCoins (reserve, not deduct yet)
        const updatedUser = getUserById(user.id);
        req.session.user.festCoins = updatedUser.festCoins;

        res.json({
            success: true,
            remainingAmount: result.remainingAmount,
            totalAmount: groepspot.totalAmount,
            newAmount: updatedUser.festCoins
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Add creator's own contribution POST
groepspotRouter.post("/creator-contribute", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    const { groepspotId, amount } = req.body;

    if (!groepspotId || !amount || amount <= 0) {
        return res.json({ success: false, error: "Ongeldige parameters" });
    }

    try {
        const groepspot = getGroepspotById(parseInt(groepspotId));
        if (!groepspot) {
            return res.json({ success: false, error: "Groepspot niet gevonden" });
        }

        if (groepspot.creatorId !== user.id) {
            return res.json({ success: false, error: "Geen toegang" });
        }

        if (groepspot.status !== 'pending') {
            return res.json({ success: false, error: "Groepspot is al afgehandeld" });
        }

        // Check balance
        const balance = getFestcoinsById(user.id);
        if (amount > balance) {
            return res.json({ success: false, error: "Niet genoeg FestCoins" });
        }

        // Check if amount exceeds remaining
        if (amount > groepspot.remainingAmount) {
            return res.json({ success: false, error: `Maximum bijdrage is ${groepspot.remainingAmount} FestCoins` });
        }

        // Check if creator already contributed
        const existingContribution = getCreatorContribution(groepspot.id, user.id);
        
        let result;
        if (existingContribution) {
            // Update existing contribution
            result = updateGroepspotContribution({
                contributionId: existingContribution.id,
                newAmount: parseInt(amount),
                userId: user.id
            });
        } else {
            // Add new contribution
            result = addGroepspotContribution({
                groepspotId: groepspot.id,
                contributorId: user.id,
                amount: parseInt(amount)
            });
        }

        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        // Update session festCoins (reserve, not deduct yet)
        const updatedUser = getUserById(user.id);
        req.session.user.festCoins = updatedUser.festCoins;

        res.json({
            success: true,
            remainingAmount: result.remainingAmount,
            totalAmount: groepspot.totalAmount,
            newAmount: updatedUser.festCoins
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Finalize groepspot (order) POST
groepspotRouter.post("/finalize", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    const { groepspotId } = req.body;

    if (!groepspotId) {
        return res.json({ success: false, error: "Groepspot ID ontbreekt" });
    }

    try {
        const groepspot = getGroepspotById(parseInt(groepspotId));
        if (!groepspot) {
            return res.json({ success: false, error: "Groepspot niet gevonden" });
        }

        if (groepspot.creatorId !== user.id) {
            return res.json({ success: false, error: "Geen toegang" });
        }

        if (groepspot.remainingAmount > 0) {
            return res.json({ success: false, error: "Nog niet volledig betaald" });
        }

        // Check budget limits for creator before finalizing
        const { getGroepspotItems } = await import("../utils/dbHulpfuncties.js");
        const groepspotItems = getGroepspotItems(groepspot.id);
        const itemsDict = {};
        groepspotItems.forEach(item => {
            itemsDict[item.itemId] = item.quantity;
        });
        const { checkBudgetLimits } = await import("../utils/dbHulpfuncties.js");
        const budgetCheck = checkBudgetLimits(groepspot.creatorId, itemsDict);

        const result = finalizeGroepspot(groepspot.id);

        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        // Store result data in case of errors later
        const transactionData = {
            transactionId: result.transactionId,
            stationId: result.stationId,
            stationName: result.stationName,
            qrCode: result.qrCode,
            orderCode: result.orderCode
        };

        try {
            // Update session for all contributors
            const contributions = getGroepspotContributions(groepspot.id);
            
            // Update session for creator
            const updatedCreator = getUserById(groepspot.creatorId);
            if (req.session.user.id === groepspot.creatorId) {
                req.session.user.festCoins = updatedCreator.festCoins;
            }

            res.json({
                success: true,
                ...transactionData,
                newAmount: req.session.user.festCoins,
                budgetExceeded: budgetCheck.exceeded,
                budgetAlarms: budgetCheck.alarms || []
            });
        } catch (sessionErr) {
            // If session update fails, still return transaction data since order was successful
            console.error('Error updating session after finalize:', sessionErr);
            res.json({
                success: true,
                ...transactionData,
                newAmount: req.session.user.festCoins || 0,
                budgetExceeded: budgetCheck.exceeded,
                budgetAlarms: budgetCheck.alarms || [],
                warning: 'Bestelling succesvol, maar sessie kon niet worden bijgewerkt'
            });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Get groepspot items GET
groepspotRouter.get("/items/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    try {
        const groepspot = getGroepspotById(parseInt(req.params.id));
        if (!groepspot) {
            return res.json({ success: false, error: "Groepspot niet gevonden" });
        }

        if (groepspot.creatorId !== user.id) {
            return res.json({ success: false, error: "Geen toegang" });
        }

        const { db } = await import("../db.js");
        const items = db.prepare(`
            SELECT * FROM groepspot_items WHERE groepspotId = ?
        `).all(groepspot.id);

        res.json({
            success: true,
            items: items.map(item => ({
                id: item.itemId,
                name: item.itemName,
                price: item.itemPrice,
                quantity: item.quantity
            }))
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

// Delete creator contribution POST
groepspotRouter.post("/delete-contribution", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.json({ success: false, error: "Niet ingelogd" });

    const { contributionId } = req.body;

    if (!contributionId) {
        return res.json({ success: false, error: "Contribution ID ontbreekt" });
    }

    try {
        const result = deleteGroepspotContribution({
            contributionId: parseInt(contributionId),
            userId: user.id
        });

        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        // Update session
        const updatedUser = getUserById(user.id);
        req.session.user.festCoins = updatedUser.festCoins;

        res.json({
            success: true,
            remainingAmount: result.remainingAmount,
            newAmount: updatedUser.festCoins
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "internal server error" });
    }
});

export default groepspotRouter;


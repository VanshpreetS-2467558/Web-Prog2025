import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import {
    getBudgetAlarms,
    upsertBudgetAlarm,
    deleteBudgetAlarm,
    toggleBudgetAlarm,
    getCategorySpending
} from "../utils/dbHulpfuncties.js";

const budgetAlarmRouter = express.Router();

// Get all budget alarms for user
budgetAlarmRouter.get("/budget-alarms", requireLogin("bezoeker"), (req, res) => {
    try {
        const alarms = getBudgetAlarms(req.session.user.id);
        const alarmsWithSpending = alarms.map(alarm => ({
            ...alarm,
            currentSpending: getCategorySpending(req.session.user.id, alarm.category)
        }));
        res.json({ success: true, alarms: alarmsWithSpending });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon alarms niet ophalen" });
    }
});

// Create or update budget alarm
budgetAlarmRouter.post("/budget-alarms", requireLogin("bezoeker"), (req, res) => {
    try {
        const { category, budgetLimit } = req.body;
        
        if (!category || !budgetLimit || budgetLimit < 0) {
            return res.json({ success: false, error: "Ongeldige gegevens" });
        }

        const validCategories = ["Drank", "Eten", "Others"];
        if (!validCategories.includes(category)) {
            return res.json({ success: false, error: "Ongeldige categorie" });
        }

        const result = upsertBudgetAlarm(req.session.user.id, category, parseInt(budgetLimit));
        if (result.success) {
            const alarm = getBudgetAlarms(req.session.user.id).find(a => 
                a.category === category
            );
            const alarmWithSpending = {
                ...alarm,
                currentSpending: getCategorySpending(req.session.user.id, category)
            };
            res.json({ success: true, alarm: alarmWithSpending });
        } else {
            res.json({ success: false, error: result.error });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon alarm niet aanmaken" });
    }
});

// Delete budget alarm
budgetAlarmRouter.delete("/budget-alarms/:id", requireLogin("bezoeker"), (req, res) => {
    try {
        const alarmId = parseInt(req.params.id);
        const result = deleteBudgetAlarm(req.session.user.id, alarmId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon alarm niet verwijderen" });
    }
});

// Toggle budget alarm active status
budgetAlarmRouter.post("/budget-alarms/:id/toggle", requireLogin("bezoeker"), (req, res) => {
    try {
        const alarmId = parseInt(req.params.id);
        const result = toggleBudgetAlarm(req.session.user.id, alarmId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon alarm status niet wijzigen" });
    }
});

export default budgetAlarmRouter;


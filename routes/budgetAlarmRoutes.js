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


// budget alarm pagina (bezoeker)
budgetAlarmRouter.get("/", requireLogin("bezoeker"), async (request, response) => {
  const { getBudgetAlarms, getCategorySpending } = await import("../utils/dbHulpfuncties.js");
  const alarms = getBudgetAlarms(request.session.user.id);
  
  // Add current spending for each alarm
  const alarmsWithSpending = alarms.map(alarm => ({
    ...alarm,
    currentSpending: getCategorySpending(request.session.user.id, alarm.category)
  }));
  
  response.render("pages/budgetAlarm", { alarms: alarmsWithSpending });
});


// Get all budget alarms for user
budgetAlarmRouter.get("/", requireLogin("bezoeker"), (req, res) => {
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
budgetAlarmRouter.post("/", requireLogin("bezoeker"), (req, res) => {
    try {
        const { category, budgetLimit, isUpdate } = req.body;
        
        if (!category || !budgetLimit || budgetLimit < 0) {
            return res.json({ success: false, error: "Ongeldige gegevens" });
        }

        const validCategories = ["Drank", "Eten", "Others"];
        if (!validCategories.includes(category)) {
            return res.json({ success: false, error: "Ongeldige categorie" });
        }

        const existingAlarm = getBudgetAlarms(req.session.user.id)
            .find(a => a.category === category);

        // === ⭐ AUTO-UPDATE HIER ⭐ ===
        // Als alarm bestaat, gaan we automatisch updaten
        const isAutomaticUpdate = existingAlarm && !isUpdate;

        // Bepalen of reset nodig is
        const currentSpending = getCategorySpending(req.session.user.id, category);
        const wasExceeded = existingAlarm && currentSpending > existingAlarm.budgetLimit;
        const shouldReset = existingAlarm && wasExceeded;

        const result = upsertBudgetAlarm(
            req.session.user.id,
            category,
            parseInt(budgetLimit),
            shouldReset
        );

        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        const updatedAlarm = getBudgetAlarms(req.session.user.id)
            .find(a => a.category === category);

        res.json({
            success: true,
            updated: isAutomaticUpdate || isUpdate,
            wasReset: shouldReset,
            alarm: {
                ...updatedAlarm,
                currentSpending: shouldReset ? 0 : getCategorySpending(req.session.user.id, category)
            }
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon alarm niet aanmaken" });
    }
});


// Delete budget alarm
budgetAlarmRouter.delete("/:id", requireLogin("bezoeker"), (req, res) => {
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
budgetAlarmRouter.post("/:id/toggle", requireLogin("bezoeker"), (req, res) => {
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


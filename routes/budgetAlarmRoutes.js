import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import {
    getBudgetAlarms,
    upsertBudgetAlarm,
    deleteBudgetAlarm,
    toggleBudgetAlarm,
    getCategorySpending,
    resetBudgetAlarmSpending
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

        // When editing (isUpdate = true), do NOT reset spending
        // Only reset when creating new alarm (which now sets resetDate automatically)
        // or when explicitly requested via reset button
        const shouldReset = false; // Never auto-reset on edit/create

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
            wasReset: false,
            alarm: {
                ...updatedAlarm,
                currentSpending: getCategorySpending(req.session.user.id, category)
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

// Reset budget alarm spending (set uitgave to 0)
budgetAlarmRouter.post("/:id/reset", requireLogin("bezoeker"), (req, res) => {
    try {
        const alarmId = parseInt(req.params.id);
        const result = resetBudgetAlarmSpending(req.session.user.id, alarmId);
        
        if (!result.success) {
            return res.json(result);
        }

        // Get updated alarm with current spending (should be 0 after reset)
        const alarms = getBudgetAlarms(req.session.user.id);
        const updatedAlarm = alarms.find(a => a.id === alarmId);
        
        res.json({
            success: true,
            alarm: {
                ...updatedAlarm,
                currentSpending: getCategorySpending(req.session.user.id, updatedAlarm.category)
            }
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon uitgaven niet resetten" });
    }
});

export default budgetAlarmRouter;


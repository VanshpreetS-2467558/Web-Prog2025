import express from "express";
import { getEventsById } from "../utils/db/events.js";
import { getStationsById, getStationsWithoutEmployeesByOrganisationId } from "../utils/db/stations.js";
import { getEmployeesByOrganisationId } from "../utils/db/employees.js";
import { getUserTypeById, deleteUserById } from "../utils/db/users.js";

const employeeRouter = express.Router();

// geteventdata POST
employeeRouter.post("/getEventData", async (req, res) => {

    try {
        const evenementen = await getEventsById(req.session.user.id);
        const stations = await getStationsById(req.session.user.id);
        return res.json({ success: true, evenementen, stations });
    } catch (err) {
        console.error(err);
        return res.json({success: false, error: "internal server error"});
    }
});


// listEmployees GET
employeeRouter.post("/listEmployees", async (req, res) => {
    console.log("listEmployees route accessed");
  try {
    const employees = await getEmployeesByOrganisationId(req.session.user.id);
    res.json({ success: true, employees });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "internal server error" });
  }
});

// getStationsWithoutEmployees POST
employeeRouter.post("/getStationsWithoutEmployees", async (req, res) => {
    try {
        const orgId = req.session.user.id;
        const stations = getStationsWithoutEmployeesByOrganisationId(orgId);
        return res.json({ success: true, stations });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, error: "internal server error" });
    }
});

// deleteEmployee POST
employeeRouter.post("/deleteEmployee", async (req, res) => {
    try {
        const employeeId = Number(req.body.employeeId); // Ensure it's a number
        if (!employeeId) {
            return res.status(400).json({ success: false, error: "employeeId ontbreekt." });
        }

        const userId = req.session.user.id;

        // check user exists and is an employee
        const targetType = await getUserTypeById(employeeId);
        if (!targetType) {
            return res.status(404).json({ success: false, error: "Gebruiker bestaat niet." });
        }

        if (targetType !== "employee") {
            return res.status(403).json({ success: false, error: "Gebruiker is geen werknemer." });
        }

        // check employee belongs to this organizer
        const myEmployees = await getEmployeesByOrganisationId(userId);
        const belongsToMe = myEmployees.some(emp => emp.id === employeeId);

        if (!belongsToMe) {
            return res.status(403).json({ success: false, error: "Geen toestemming om deze werknemer te verwijderen." });
        }

        // delete user (cascades to employees table)
        const deleteResult = await deleteUserById(employeeId);
        if (!deleteResult.success) {
            return res.status(500).json({ success: false, error: "Verwijderen mislukt." });
        }

        return res.json({ success: true });

    } catch (err) {
        console.error("Delete employee error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});

export { employeeRouter };
import express from "express";
import { getEventsById } from "../utils/db/events.js";
import { getStationsById, getStationsWithoutEmployeesByOrganisationId } from "../utils/db/stations.js";
import { getEmployeesByOrganisationId, getEmployeeEncryptedPassword } from "../utils/db/employees.js";
import { getUserTypeById, deleteUserById, getUserById } from "../utils/db/users.js";
import { decryptPassword } from "../utils/encryption.js";
import { isPasswordCorrect } from "../utils/validatieHulpfuncties.js";

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

// viewEmployeePassword POST - decrypt and view employee password
employeeRouter.post("/viewEmployeePassword", async (req, res) => {
  try {
    const { employeeId, organizerPassword } = req.body;
    const organizerId = req.session.user.id;

    if (!employeeId || !organizerPassword) {
      return res.status(400).json({ success: false, error: "Employee ID en organisator wachtwoord zijn vereist." });
    }

    // Verify organizer password
    const organizer = getUserById(organizerId);
    if (!organizer) {
      return res.status(404).json({ success: false, error: "Organisator niet gevonden." });
    }

    const passwordMatch = await isPasswordCorrect(organizerPassword, organizer.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: "Organisator wachtwoord is incorrect." });
    }

    // Check employee belongs to this organizer
    const employees = await getEmployeesByOrganisationId(organizerId);
    const employee = employees.find(emp => emp.id === parseInt(employeeId));
    
    if (!employee) {
      return res.status(403).json({ success: false, error: "Geen toestemming om dit wachtwoord te bekijken." });
    }

    // Get encrypted password
    const encryptedPassword = getEmployeeEncryptedPassword(parseInt(employeeId));
    if (!encryptedPassword) {
      return res.status(404).json({ success: false, error: "Geen versleuteld wachtwoord gevonden voor deze werknemer." });
    }

    // Decrypt password
    try {
      const decryptedPassword = decryptPassword(encryptedPassword, organizerPassword);
      return res.json({ success: true, password: decryptedPassword });
    } catch (decryptErr) {
      console.error("Decryption error:", decryptErr);
      return res.status(500).json({ success: false, error: "Fout bij ontsleutelen wachtwoord." });
    }

  } catch (err) {
    console.error("View employee password error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export { employeeRouter };
import express from "express";
import { getEventsById, getStationsById, getEmployeesByOrganisationId, getStationsWithoutEmployeesByOrganisationId } from "../utils/dbHulpfuncties.js"

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


export { employeeRouter };
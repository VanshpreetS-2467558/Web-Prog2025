import express from "express";
import { getEventsById, getStationsById } from "../utils/dbHulpfuncties.js"

const employeeRouter = express.Router();

employeeRouter.post("/getEventData", async (req, res) => {

    console.log("test");
    try {
        const evenementen = await getEventsById(req.session.user.id);
        const stations = await getStationsById(req.session.user.id);
        return res.json({ success: true, evenementen, stations });
    } catch (err) {
        console.error(err);
        return res.json({success: false, error: "internal server error"});
    }
});


export { employeeRouter };
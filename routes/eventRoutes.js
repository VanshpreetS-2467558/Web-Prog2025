import express from "express";
import { checkEventName,
    checkStationName,
    getAllItemsByStation,
    getAllEventsByOrganisator,
    getAllEvents,
    getAllStationsByEvent,
    checkItemName,
    createEvent,
    deleteEvent,
    searchEventById,
    updateEventById,
    createLocationByEvent,
    createItemByLocation
} from "../utils/db/events.js";
import { deleteItem } from "../utils/db/items.js";
import { deleteLocation } from "../utils/db/stations.js";
import {requireLogin} from "../middleware/requireLogin.js";
import { getActiveVisitorsCount } from "../utils/db/eventVisitors.js";


const eventRouter = express.Router();

// event beheren pagina
eventRouter.get("/event-management", requireLogin("organisator"), async (req, res) => {
    try {
        const orgId = req.session.user.id;
        const events = getAllEventsByOrganisator(orgId);

        const now = new Date();

        events.forEach(event => {
            
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            event.isLive = now >= start && now < end;
            
            // Add visitor count
            event.attendees = getActiveVisitorsCount(event.id);
            const stations = getAllStationsByEvent(event.id);
            stations.forEach(station => {
                station.items = getAllItemsByStation(station.id);
            });
            event.stations = stations;
        });
        res.render("pages/orgEvent", { events });
    } catch(err) {
        console.error(err);
        res.render("pages/orgEvent", { events: [] });
    }
});

// evenementen lijst pagina bij bezoekers
eventRouter.get("/evenementen", requireLogin("bezoeker"), async (req, res) => {
    try {
        const now = new Date();

        let events = getAllEvents();

        // filter op live (events die nu actief zijn)
        events = events.filter(event => {
            try {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                // Event is live als nu tussen start en end is (inclusief end tijd)
                const isLive = now >= start && now <= end;
                return isLive;
            } catch (err) {
                console.error(`Error parsing dates for event ${event.id}:`, err);
                return false;
            }
        });

        // Add visitor count to each event
        const { getActiveVisitorsCount } = await import("../utils/db/eventVisitors.js");
        events.forEach(event => {
            event.attendees = getActiveVisitorsCount(event.id);
        });

        res.render("pages/eventLijst", { events });
    } catch (err) {
        console.error("Error in /evenementen route:", err);
        res.render("pages/eventLijst", { events: [] });
    }
});

// event aanmaken
eventRouter.post("/createEvent", async (req, res) =>{
    try{
        const {name, location, description, startDate,endDate} = req.body
        const organisatorid = req.session.user.id;

        // validation
        if(!name || !location || !startDate || !endDate) return res.json({ success: false, error: "Vul alle verplichte velden in." });
        if(checkEventName(name)) return res.json({ success: false, error: "Er bestaat al een evenement met deze naam." });

        const result = createEvent({ organisatorid, name, location, description, startDate, endDate });
        if (result.changes > 0) {   
            res.json({ success: true});
        } else{
            res.json({ success: false, error: "Kon het evenement niet aanmaken." });
        }

    }catch (err){
        console.error(err);
        res.json({ success: false, error: "Er is iets misgegaan bij het aanmaken van jouw evenenement." });
    }
});

eventRouter.post("/addLocation", async (req,res) => {
    const { eventId, name } = req.body;

    if (!eventId || !name) return res.json({ success: false , error: "Er is iets misgegaan. Probeer het later opnieuw." });
    try{

        // check of naam al bestaat voor dat event
        const existing = checkStationName(eventId, name);
        if (existing) {
            return res.json({ success: false, error: "Er bestaat al een locatie met deze naam voor dit evenement." });
        }

        createLocationByEvent(eventId, name);

        res.json({ success: true });
    } catch(err){
        console.log(err);
        res.json({ success: false , error: "Er is iets misgegaan. Probeer het later opnieuw." });
    }
});

eventRouter.post("/addItem", async (req, res) => {
    const { sectionId, name, price, stock, category } = req.body;

    if (!sectionId || !name || !price || !stock || !category) {
        return res.json({ success: false, error: "Alle velden zijn verplicht." });
    }
    if(price <= 0 || stock <= 0){
        return res.json({ success: false, error: "Prijs en voorraad moeten groter zijn dan 0." });
    }

    try {
        // Check if item with same name already exists in this station
        const existing = checkItemName(sectionId, name);
        if (existing) {
            return res.json({ success: false, error: "Er bestaat al een item met deze naam in dit station." });
        }

        createItemByLocation(sectionId, name, price, stock, category);

        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.json({ success: false, error: "Er is iets misgegaan bij het toevoegen van het item." });
    }
});


eventRouter.post("/deleteEvent", async (req, res) => {
    const { id } = req.body;
    try {
        const result = deleteEvent(id);
        if(result.success) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: result.error || "Kon het event niet verwijderen. Probeer het later opnieuw." });
        }
    } catch(err) {
        console.error(err);
        res.json({ success: false, error: "Kon het event niet verwijderen. Probeer het later opnieuw." });
    }
});

eventRouter.post("/deleteItem", async (req, res) => {
    const {id} = req.body;
    try{
        const result = deleteItem(id);
        if(result.success) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: result.error || "Kon het item niet verwijderen. Probeer het later opnieuw." });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon het item niet verwijderen. Probeer het later opnieuw." });
    }
});

eventRouter.post("/deleteStation", async (req, res) => {
    const {id} = req.body;
    try{
        const result = deleteLocation(id);
        if(result.success) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: result.error || "Kon het locatie niet verwijderen. Probeer het later opnieuw." });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon het locatie niet verwijderen. Probeer het later opnieuw." });
    }
});


eventRouter.get("/findEvent", async (req,res)=>{
    const eventId = parseInt(req.query.eventId);
    if(isNaN(eventId)) return res.json({ success:false, error:"Ongeldig event ID." });
    try{
        const result = searchEventById(eventId);
        res.json({success:true, event: result})
    } catch(err){
        console.error(err);
        res.json({ success: false, error: "Fout bij zoeken van event details, probeer het later opnieuw." })
    }
});

eventRouter.post("/updateEventDetails", async (req, res) => {
    const {eventId , updatedFields} = req.body;
    if(!eventId || Object.keys(updatedFields).length === 0) return res.json({success: false, error: "Geen updates opgegeven."});

    if(updatedFields.name){
        const nameCheck = checkEventName(updatedFields.name);
        if(nameCheck) return res.json({ success: false, error: "Er bestaat al een evenement met deze naam." });
    }

    try{
        const result = updateEventById(eventId, updatedFields);
        res.json({ success: true});
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Er is iets fout gegaan, probeer het later opnieuw." });
    }
});

export default eventRouter;
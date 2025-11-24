import express from "express";
import {checkNameEvent, createEvent} from "../utils/dbHulpfuncties.js";
import {requireLogin} from "../middleware/requireLogin.js";

import { db } from "../db.js";

const eventRouter = express.Router();

// event beheren pagina
eventRouter.get("/event-management",requireLogin("organisator") ,(req,res)=>{

    const orgId = req.session.user.id;

    const events = db.prepare("SELECT * FROM events WHERE organisatorid = ?").all(orgId);
    if(events.length === 0) return res.render("pages/orgEvent", { events: null });

    events.forEach(event => {
        const stations = db.prepare("SELECT * FROM stations WHERE eventId = ?").all(event.id);
 
        stations.forEach(station => {
            station.items = db.prepare("SELECT * FROM items WHERE locationId = ?").all(station.id)
        });

        event.stations = stations;
    });


    res.render("pages/orgEvent", {events});
});


// event aanmaken
eventRouter.post("/createEvent", async (req, res) =>{
    try{
        const {name, location, description, startDate,endDate} = req.body
        const organisatorid = req.session.user.id;

        // validation
        if(!name || !location || !startDate || !endDate) return res.json({ success: false, error: "Vul alle verplichte velden in." });
        if(checkNameEvent(name)) return res.json({ success: false, error: "Er bestaat al een event met deze naam." });

        const result = createEvent({ organisatorid, name, location, description, startDate, endDate });
        if (result.changes > 0) {   
            res.json({ success: true});
        } else{
            res.json({ success: false, error: "Kon het event niet aanmaken." });
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
        const existing = db.prepare("SELECT id FROM stations WHERE eventId = ? AND name = ?").get(eventId, name);
        if (existing) {
            return res.json({ success: false, error: "Er bestaat al een locatie met deze naam voor dit evenement." });
        }

        db.prepare(`
        INSERT INTO stations (eventId, name)
        VALUES (?, ?)
        `).run(eventId, name);

        res.json({ success: true });
    } catch(err){
        console.log(err);
        res.json({ success: false , error: "Er is iets misgegaan. Probeer het later opnieuw." });
    }
});

eventRouter.post("/addItem", async (req, res) => {
    const { sectionId, name, price, stock } = req.body;

    if (!sectionId || !name || !price || !stock) {
        return res.json({ success: false, error: "Alle velden zijn verplicht." });
    }

    try {
        db.prepare(`
            INSERT INTO items (locationId, name, price, stock)
            VALUES (?, ?, ?, ?)
        `).run(sectionId, name, price, stock);

        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.json({ success: false, error: "Er is iets misgegaan bij het toevoegen van het item." });
    }
});

export default eventRouter;
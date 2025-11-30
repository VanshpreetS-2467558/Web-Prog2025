import express from "express";
import {checkNameEvent, createEvent, deleteEvent, deleteItem, deleteLocation, searchEventById, updateEventById} from "../utils/dbHulpfuncties.js";
import {requireLogin} from "../middleware/requireLogin.js";

import { db } from "../db.js";

const eventRouter = express.Router();

// event beheren pagina
eventRouter.get("/event-management", requireLogin("organisator"), (req, res) => {
    try {
        const orgId = req.session.user.id;
        const events = db.prepare("SELECT * FROM events WHERE organisatorid = ?").all(orgId) || [];

        const now = new Date();


        events.forEach(event => {
            
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            event.isLive = now >= start && now < end;

            const stations = db.prepare("SELECT * FROM stations WHERE eventId = ?").all(event.id) || [];
            stations.forEach(station => {
                station.items = db.prepare("SELECT * FROM items WHERE locationId = ?").all(station.id) || [];
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
eventRouter.get("/evenementen", requireLogin("bezoeker"), (req, res) => {
    try {
        const now = new Date();

        let events = db.prepare("SELECT * FROM events").all() || [];

        // filter op live
        events = events.filter(event => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            return now >= start && now < end;
        });

        res.render("pages/eventLijst", { events });
    } catch (err) {
        console.error(err);
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
        if(checkNameEvent(name)) return res.json({ success: false, error: "Er bestaat al een evenement met deze naam." });

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
    const { sectionId, name, price, stock, category } = req.body;

    if (!sectionId || !name || !price || !stock || !category) {
        return res.json({ success: false, error: "Alle velden zijn verplicht." });
    }

    try {
        db.prepare(`
            INSERT INTO items (locationId, name, price, stock, category)
            VALUES (?, ?, ?, ?, ?)
        `).run(sectionId, name, price, stock, category);

        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.json({ success: false, error: "Er is iets misgegaan bij het toevoegen van het item." });
    }
});


eventRouter.post("/deleteEvent", async (req, res) => {
    const { id } = req.body;
    try {
        deleteEvent(id);
        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.json({ success: false, error: "Kon het event niet verwijderen. Probeer het later opnieuw." });
    }
});

eventRouter.post("/deleteItem", async (req, res) => {
    const {id} = req.body;
    try{
        deleteItem(id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon het item niet verwijderen. Probeer het later opnieuw." })
    }
});

eventRouter.post("/deleteStation", async (req, res) => {
    const {id} = req.body;
    try{
        deleteLocation(id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Kon het locatie niet verwijderen. Probeer het later opnieuw." })
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
        const nameCheck = checkNameEvent(updatedFields.name);
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
import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import { getOrderDetails, getOrderDetailsByQrCode, getOrderDetailsByOrderCode, getEmployeeStationId, getEmployeeEventId, markOrderAsHandled } from "../utils/dbHulpfuncties.js";
import { db } from "../db.js";

const orderRouter = express.Router();

// Get order details by QR code (for employee scanning)
orderRouter.get("/order/qr/:qrCode", requireLogin("employee"), (req, res) => {
    try {
        const qrCode = req.params.qrCode;
        
        // QR code format: ORDER_<random hex>
        if (!qrCode.startsWith('ORDER_')) {
            return res.json({ success: false, error: "Ongeldige QR code" });
        }
        
        // Get employee's station ID and event ID
        const employeeStationId = getEmployeeStationId(req.session.user.id);
        const employeeEventId = getEmployeeEventId(req.session.user.id);
        
        if (!employeeStationId) {
            return res.json({ success: false, error: "Je bent niet toegewezen aan een station" });
        }
        
        // Get order details by QR code
        const orderDetails = getOrderDetailsByQrCode(qrCode);
        
        if (!orderDetails) {
            return res.json({ success: false, error: "Bestelling niet gevonden" });
        }
        
        // Check if order is from different event
        if (orderDetails.orderEventId && employeeEventId && orderDetails.orderEventId !== employeeEventId) {
            return res.json({ 
                success: false, 
                error: "Deze QR-code/bestelling is van een ander evenement. Je kunt alleen bestellingen van jouw huidige evenement afhandelen." 
            });
        }
        
        // Check if station matches
        if (employeeStationId !== orderDetails.stationId) {
            return res.json({ 
                success: false, 
                error: `Dit is een bestelling van station: ${orderDetails.stationName}. Je werkt op een ander station.` 
            });
        }
        
        // Check if already handled
        if (orderDetails.handled === 1) {
            return res.json({ success: false, error: "Deze bestelling is al afgehandeld" });
        }
        
        res.json({ success: true, order: orderDetails });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Fout bij ophalen bestelling" });
    }
});

// Mark order as handled
orderRouter.post("/order/:transactionId/handle", requireLogin("employee"), (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        
        // Verify employee is at correct station
        const orderDetails = getOrderDetails(transactionId);
        if (!orderDetails) {
            return res.json({ success: false, error: "Bestelling niet gevonden" });
        }
        
        const employeeStationId = getEmployeeStationId(req.session.user.id);
        if (employeeStationId !== orderDetails.stationId) {
            return res.json({ success: false, error: "Je werkt niet op het juiste station voor deze bestelling" });
        }
        
        const result = markOrderAsHandled(transactionId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Fout bij afhandelen bestelling" });
    }
});

// Get order details by 6-digit code (for manual entry)
orderRouter.get("/order/code/:code", requireLogin("employee"), (req, res) => {
    try {
        const code = req.params.code;
        
        // Code should be 6 digits
        if (!/^\d{6}$/.test(code)) {
            return res.json({ success: false, error: "Ongeldige code format" });
        }
        
        // Get employee's event ID and station ID
        const employeeEventId = getEmployeeEventId(req.session.user.id);
        const employeeStationId = getEmployeeStationId(req.session.user.id);
        
        if (!employeeStationId) {
            return res.json({ success: false, error: "Je bent niet toegewezen aan een station" });
        }
        
        // Get order details by order code
        const orderDetails = getOrderDetailsByOrderCode(code);
        
        if (!orderDetails) {
            return res.json({ success: false, error: "Bestelling niet gevonden" });
        }
        
        // Check if order is from different event
        if (orderDetails.orderEventId && employeeEventId && orderDetails.orderEventId !== employeeEventId) {
            return res.json({ 
                success: false, 
                error: "Deze code/bestelling is van een ander evenement. Je kunt alleen bestellingen van jouw huidige evenement afhandelen." 
            });
        }
        
        // Check if station matches
        if (employeeStationId !== orderDetails.stationId) {
            return res.json({ 
                success: false, 
                error: `Dit is een bestelling van station: ${orderDetails.stationName}. Je werkt op een ander station.` 
            });
        }
        
        // Check if already handled
        if (orderDetails.handled === 1) {
            return res.json({ success: false, error: "Deze bestelling is al afgehandeld" });
        }
        
        res.json({ success: true, order: orderDetails });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Fout bij ophalen bestelling" });
    }
});

// Check order status (for visitor polling)
orderRouter.get("/order/status/:transactionId", requireLogin("bezoeker"), (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        const orderDetails = getOrderDetails(transactionId);
        
        if (!orderDetails) {
            return res.json({ success: false, error: "Bestelling niet gevonden" });
        }
        
        res.json({ 
            success: true, 
            handled: orderDetails.handled === 1 
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Fout bij ophalen bestelling status" });
    }
});

export default orderRouter;


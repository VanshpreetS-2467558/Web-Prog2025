import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import { getOrderDetails, getEmployeeStationId, markOrderAsHandled } from "../utils/dbHulpfuncties.js";

const orderRouter = express.Router();

// Get order details by QR code (for employee scanning)
orderRouter.get("/order/qr/:qrCode", requireLogin("employee"), (req, res) => {
    try {
        const qrCode = req.params.qrCode;
        
        // QR code format: ORDER_transactionId_stationId
        if (!qrCode.startsWith('ORDER_')) {
            return res.json({ success: false, error: "Ongeldige QR code" });
        }
        
        const parts = qrCode.split('_');
        if (parts.length !== 3) {
            return res.json({ success: false, error: "Ongeldige QR code format" });
        }
        
        const transactionId = parseInt(parts[1]);
        const orderStationId = parseInt(parts[2]);
        
        // Get employee's station ID
        const employeeStationId = getEmployeeStationId(req.session.user.id);
        
        if (!employeeStationId) {
            return res.json({ success: false, error: "Je bent niet toegewezen aan een station" });
        }
        
        // Check if station matches
        if (employeeStationId !== orderStationId) {
            const orderDetails = getOrderDetails(transactionId);
            return res.json({ 
                success: false, 
                error: `Dit is een bestelling van station: ${orderDetails?.stationName || 'Onbekend'}. Je werkt op een ander station.` 
            });
        }
        
        // Get order details
        const orderDetails = getOrderDetails(transactionId);
        
        if (!orderDetails) {
            return res.json({ success: false, error: "Bestelling niet gevonden" });
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


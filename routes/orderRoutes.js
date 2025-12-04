import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import { getOrderDetails, getEmployeeStationId, markOrderAsHandled } from "../utils/dbHulpfuncties.js";
import { db } from "../db.js";

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

// Get order details by 6-digit code (for manual entry)
orderRouter.get("/order/code/:code", requireLogin("employee"), (req, res) => {
    try {
        const code = req.params.code;
        
        // Code should be 6 digits
        if (!/^\d{6}$/.test(code)) {
            return res.json({ success: false, error: "Ongeldige code format" });
        }
        
        // Convert 6-digit code to transactionId (code is last 6 digits of transactionId)
        // We need to find transaction by matching the last 6 digits
        const transactionId = parseInt(code);
        
        // Get order details
        const orderDetails = getOrderDetails(transactionId);
        
        if (!orderDetails) {
            // Try to find by matching last 6 digits
            const transactions = db.prepare(`
                SELECT id FROM transactions 
                WHERE CAST(id AS TEXT) LIKE ?
                ORDER BY id DESC
                LIMIT 1
            `).all(`%${code}`);
            
            if(transactions.length === 0) {
                return res.json({ success: false, error: "Bestelling niet gevonden" });
            }
            
            const foundTransactionId = transactions[0].id;
            const foundOrderDetails = getOrderDetails(foundTransactionId);
            
            if(!foundOrderDetails) {
                return res.json({ success: false, error: "Bestelling niet gevonden" });
            }
            
            // Verify employee is at correct station
            const employeeStationId = getEmployeeStationId(req.session.user.id);
            
            if (!employeeStationId) {
                return res.json({ success: false, error: "Je bent niet toegewezen aan een station" });
            }
            
            if (employeeStationId !== foundOrderDetails.stationId) {
                return res.json({ 
                    success: false, 
                    error: `Dit is een bestelling van station: ${foundOrderDetails?.stationName || 'Onbekend'}. Je werkt op een ander station.` 
                });
            }
            
            if (foundOrderDetails.handled === 1) {
                return res.json({ success: false, error: "Deze bestelling is al afgehandeld" });
            }
            
            return res.json({ success: true, order: foundOrderDetails });
        }
        
        // Verify employee is at correct station
        const employeeStationId = getEmployeeStationId(req.session.user.id);
        
        if (!employeeStationId) {
            return res.json({ success: false, error: "Je bent niet toegewezen aan een station" });
        }
        
        if (employeeStationId !== orderDetails.stationId) {
            return res.json({ 
                success: false, 
                error: `Dit is een bestelling van station: ${orderDetails?.stationName || 'Onbekend'}. Je werkt op een ander station.` 
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


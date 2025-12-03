import express from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import PDFDocument from "pdfkit";
import {
  getVisitorsToday,
  getVisitorsPerHourToday,
  getTotalRevenue,
  getTotalVisitors,
  getPopularItems,
  getTransactionsPerHourToday,
  getEventInfo,
  getTotalItemsSold,
  getTotalTransactions
} from "../utils/db/dashboard.js";
import { getAllTransactionsForOrganizer } from "../utils/db/transactions.js";
import { db } from "../db.js";

const dashboardRouter = express.Router();

// Get dashboard data for organizer
dashboardRouter.get("/data", requireLogin("organisator"), async (req, res) => {
  try {
    const organizerId = req.session.user.id;
    const eventId = req.query.eventId ? parseInt(req.query.eventId) : null;

    const visitorsToday = getVisitorsToday(organizerId, eventId);
    const visitorsPerHour = getVisitorsPerHourToday(organizerId, eventId);
    const totalRevenue = getTotalRevenue(organizerId, eventId);
    const totalVisitors = getTotalVisitors(organizerId, eventId);
    const popularItems = getPopularItems(organizerId, eventId);
    const transactionsPerHour = getTransactionsPerHourToday(organizerId, eventId);
    const eventInfo = getEventInfo(organizerId, eventId);

    res.json({
      success: true,
      data: {
        visitorsToday,
        visitorsPerHour,
        totalRevenue,
        totalVisitors,
        popularItems,
        transactionsPerHour,
        eventInfo
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "internal server error" });
  }
});

// Export dashboard data to PDF
dashboardRouter.get("/export-pdf", requireLogin("organisator"), async (req, res) => {
  try {
    const organizerId = req.session.user.id;
    const eventId = req.query.eventId ? parseInt(req.query.eventId) : null;

    // Get event(s) data
    let events;
    if (eventId) {
      const event = db.prepare(`
        SELECT e.*, u.name as organizerName
        FROM events e
        JOIN users u ON e.organisatorid = u.id
        WHERE e.id = ? AND e.organisatorid = ?
      `).get(eventId, organizerId);
      events = event ? [event] : [];
    } else {
      events = db.prepare(`
        SELECT e.*, u.name as organizerName
        FROM events e
        JOIN users u ON e.organisatorid = u.id
        WHERE e.organisatorid = ?
        ORDER BY e.startDate DESC
      `).all(organizerId);
    }

    if (events.length === 0) {
      return res.status(404).json({ success: false, error: "No events found" });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    const filename = eventId 
      ? `event-export-${events[0].name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      : `all-events-export.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Generate PDF for each event (or single event)
    events.forEach((event, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Event info section
      doc.fontSize(20).font('Helvetica-Bold').text('Evenement Informatie', { align: 'center' });
      doc.moveDown();
      
      // Format dates
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('nl-NL', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      };
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`Naam: ${event.name}`, { align: 'left' });
      doc.text(`Startdatum: ${formatDate(event.startDate)}`, { align: 'left' });
      doc.text(`Einddatum: ${formatDate(event.endDate)}`, { align: 'left' });
      doc.text(`Locatie: ${event.location}`, { align: 'left' });
      doc.text(`Organisator: ${event.organizerName}`, { align: 'left' });
      doc.text(`Huidige tijd: ${formatDate(new Date())}`, { align: 'left' });
      
      doc.moveDown(2);

      // Get statistics for this event
      const totalRevenue = getTotalRevenue(organizerId, event.id);
      const totalVisitors = getTotalVisitors(organizerId, event.id);
      const totalTransactions = getTotalTransactions(organizerId, event.id);
      const totalItemsSold = getTotalItemsSold(organizerId, event.id);

      // General info section
      doc.fontSize(16).font('Helvetica-Bold').text('Algemene Informatie', { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`Totale Omzet: ${totalRevenue} FestCoins (€${totalRevenue})`, { align: 'left' });
      doc.text(`Totaal Bezoekers: ${totalVisitors}`, { align: 'left' });
      doc.text(`Totaal Transacties: ${totalTransactions}`, { align: 'left' });
      doc.text(`Totaal Items Verkocht: ${totalItemsSold}`, { align: 'left' });
      
      doc.moveDown(2);

      // Transactions section
      doc.fontSize(16).font('Helvetica-Bold').text('Transacties', { align: 'left' });
      doc.moveDown();

      const transactions = getAllTransactionsForOrganizer(organizerId, event.id);
      
      if (transactions.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Geen transacties gevonden.', { align: 'left' });
      } else {
        // Table header
        const tableTop = doc.y;
        const itemHeight = 20;
        const tableStartX = 50;
        const colWidths = { id: 50, date: 110, station: 100, items: 150, price: 70 };
        
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('ID', tableStartX, tableTop);
        doc.text('Datum', tableStartX + colWidths.id, tableTop);
        doc.text('Station', tableStartX + colWidths.id + colWidths.date, tableTop);
        doc.text('Items', tableStartX + colWidths.id + colWidths.date + colWidths.station, tableTop);
        doc.text('Prijs', tableStartX + colWidths.id + colWidths.date + colWidths.station + colWidths.items, tableTop);
        
        // Draw line under header
        const totalTableWidth = colWidths.id + colWidths.date + colWidths.station + colWidths.items + colWidths.price;
        doc.moveTo(tableStartX, tableTop + 15)
           .lineTo(tableStartX + totalTableWidth, tableTop + 15)
           .stroke();
        
        // Transaction rows
        let currentY = tableTop + 25;
        doc.fontSize(9).font('Helvetica');
        
        transactions.forEach((transaction, idx) => {
          // Check if we need a new page
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
          
          const date = formatDate(transaction.date);
          const stationText = transaction.stationName || 'Onbekend Station';
          const itemsText = transaction.items || 'N/A';
          const priceText = `${transaction.totalPrice} FC`;
          
          doc.text(String(transaction.id), tableStartX, currentY);
          doc.text(date, tableStartX + colWidths.id, currentY);
          doc.text(stationText, tableStartX + colWidths.id + colWidths.date, currentY, { width: colWidths.station });
          
          // Wrap items text if too long
          const itemsLines = doc.heightOfString(itemsText, { width: colWidths.items });
          doc.text(itemsText, tableStartX + colWidths.id + colWidths.date + colWidths.station, currentY, { width: colWidths.items });
          doc.text(priceText, tableStartX + colWidths.id + colWidths.date + colWidths.station + colWidths.items, currentY);
          
          currentY += Math.max(itemsLines, itemHeight) + 5;
        });
      }
    });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ success: false, error: "Error generating PDF" });
  }
});

export default dashboardRouter;


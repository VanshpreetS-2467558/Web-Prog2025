import express from "express";
import { db } from "../db.js";

const transactionRouter = express.Router();

// transaction POST
transactionRouter.post("/transaction", async (req, res) => {
    const user = req.session.user;
    const itemsDict = req.body.items;

    try {
        db.prepare("BEGIN TRANSACTION").run();

        let totalPrice = 0;
        const itemsData = [];

        // 1. validate + price calc
        for (const [itemId, qty] of Object.entries(itemsDict)) {
            const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);

            if (!item)
                return res.json({ success: false, error: "Item bestaat niet." });

            if (qty > item.stock)
                return res.json({ success: false, error: `Niet genoeg voorraad van ${item.name}` });

            totalPrice += item.price * qty;

            itemsData.push({
                id: item.id,
                name: item.name,
                price: item.price,
                qty
            });
        }

        // 2. balance check
        const userBalance = db.prepare("SELECT festCoins FROM users WHERE id = ?").get(user.id).festCoins;
        if (totalPrice > userBalance)
            return res.json({ success: false, error: "Te weinig FestCoins." });

        // 3. subtract coins
        db.prepare("UPDATE users SET festCoins = festCoins - ? WHERE id = ?").run(totalPrice, user.id);
        req.session.user.festCoins -= totalPrice;

        // 4. maak één transactie
        const result = db.prepare(`
            INSERT INTO transactions (bezoekerId, totalPrice)
            VALUES (?, ?)
        `).run(user.id, totalPrice);

        const transactionId = result.lastInsertRowid;

        // 5. voeg alle items toe
        const insertItem = db.prepare(`
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);

        const updateStock = db.prepare(`UPDATE items SET stock = stock - ? WHERE id = ?`);

        itemsData.forEach(it => {
            insertItem.run(transactionId, it.id, it.name, it.price, it.qty);
            updateStock.run(it.qty, it.id);
        });

        db.prepare("COMMIT").run();

        res.json({success: true, newAmount: req.session.user.festCoins});

    } catch (err) {
        db.prepare("ROLLBACK").run();
        console.log(err);
        res.json({ success: false, error: "internal server error" });
    }
});


export default transactionRouter;

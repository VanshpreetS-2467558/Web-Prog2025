import { db } from "../../db.js";
import { getFestcoinsById, updateCoins } from "./users.js";

export function makeTransaction(userId, itemsDict) {
  const itemsData = [];
  let totalPrice = 0;

  try {
    db.prepare("BEGIN TRANSACTION").run();

    for (const [itemId, qty] of Object.entries(itemsDict)) {
      const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
      if (!item) throw new Error(`Item ${itemId} bestaat niet`);
      if (qty > item.stock) throw new Error(`Niet genoeg voorraad van ${item.name}`);

      totalPrice += item.price * qty;

      itemsData.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty,
      });
    }

    const balance = getFestcoinsById(userId);
    if (totalPrice > balance) throw new Error("Te weinig FestCoins.");

    updateCoins({ value: -totalPrice, user: { id: userId } });

    const result = db
      .prepare(
        `
            INSERT INTO transactions (bezoekerId, totalPrice) VALUES (?, ?)
        `
      )
      .run(userId, totalPrice);

    const transactionId = result.lastInsertRowid;

    const insertItem = db.prepare(
      `
            INSERT INTO transaction_items (transactionId, itemId, itemName, itemPrice, quantity)
            VALUES (?, ?, ?, ?, ?)
        `
    );
    const updateStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");

    itemsData.forEach((it) => {
      insertItem.run(transactionId, it.id, it.name, it.price, it.qty);
      updateStock.run(it.qty, it.id);
    });

    db.prepare("COMMIT").run();

    return { success: true, totalPrice, items: itemsData };
  } catch (err) {
    db.prepare("ROLLBACK").run();
    return { success: false, error: err.message };
  }
}


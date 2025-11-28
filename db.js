import Database from "better-sqlite3";

export const db = new Database("database.db", { verbose: console.log });

export function InitializeDatabase() { // moet async als we gaan hashen (met bcrypt?)
  db.pragma("journal_mode = WAL;");
  db.pragma("busy_timeout = 5000;");
  db.pragma("synchronous = NORMAL;");
  db.pragma("cache_size = 1000000000;");
  db.pragma("foreign_keys = true;");
  db.pragma("temp_store = memory;");

  // user table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      festCoins INTEGER NOT NULL DEFAULT 0
      ) STRICT
  `).run();
  
  // event gerichte tabellen// 
  // event tabel
  db.prepare(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organisatorid INTEGER,
      name TEXT,
      location TEXT,
      description TEXT,
      startDate TEXT,
      endDate TEXT,
      FOREIGN KEY(organisatorid) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT
  `).run();
  // verkoop locaties (standjes, bar,..) table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER,
      name TEXT,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE
    ) STRICT
  `).run();
  // items table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locationId INTEGER,
      name TEXT,
      price INTEGER,
      stock INTEGER,
      FOREIGN KEY(locationId) REFERENCES stations(id) ON DELETE CASCADE
    ) STRICT
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bezoekerId INTEGER,
      totalPrice INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      handled INTEGER DEFAULT 0,
      FOREIGN KEY(bezoekerId) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionId INTEGER,
      itemId INTEGER,
      itemName TEXT NOT NULL,
      itemPrice INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(transactionId) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE SET NULL
      
    ) STRICT
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS event_visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER,
      userId INTEGER,
      visitTime TEXT DEFAULT CURRENT_TIMESTAMP,
      leftAt TEXT DEFAULT NULL,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT
  `).run();
 

  
  // voor id
  const row = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'users'").get();
  if (!row) {
      db.prepare("INSERT INTO sqlite_sequence(name, seq) VALUES('users', 2426909)").run();
  }
}



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
      category TEXT,
      FOREIGN KEY(locationId) REFERENCES stations(id) ON DELETE CASCADE
    ) STRICT
  `).run();

  
  // transactions table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bezoekerId INTEGER,
      totalPrice INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      handled INTEGER DEFAULT 0,
      qrCode TEXT UNIQUE,
      orderCode TEXT UNIQUE,
      FOREIGN KEY(bezoekerId) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT
  `).run();
  
  // Add qrCode and orderCode columns if they don't exist (migration)
  // SQLite doesn't support UNIQUE in ALTER TABLE ADD COLUMN, so we add the column first, then create unique index
  try {
    db.prepare(`ALTER TABLE transactions ADD COLUMN qrCode TEXT`).run();
    // Create unique index for qrCode
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_qrCode ON transactions(qrCode)`).run();
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column')) {
      console.error('Error adding qrCode column:', err);
    }
  }
  
  try {
    db.prepare(`ALTER TABLE transactions ADD COLUMN orderCode TEXT`).run();
    // Create unique index for orderCode
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_orderCode ON transactions(orderCode)`).run();
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column')) {
      console.error('Error adding orderCode column:', err);
    }
  }

  // transaction items table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionId INTEGER,
      itemId INTEGER,
      itemName TEXT NOT NULL,
      itemPrice INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      itemCategory TEXT,
      FOREIGN KEY(transactionId) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE SET NULL
      
    ) STRICT
  `).run();
  
  // Add itemCategory column if it doesn't exist (migration)
  try {
    db.prepare(`ALTER TABLE transaction_items ADD COLUMN itemCategory TEXT`).run();
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column') && !err.message.includes('duplicate column name')) {
      console.error('Error adding itemCategory column:', err.message);
    }
  }
  
  // event visitors table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS event_visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER,
      userId INTEGER,
      visitTime TEXT DEFAULT CURRENT_TIMESTAMP,
      leftAt TEXT DEFAULT NULL,
      lastHeartbeat TEXT DEFAULT NULL,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT
  `).run();
  
  // Add lastHeartbeat column if it doesn't exist (migration)
  try {
    db.prepare(`ALTER TABLE event_visitors ADD COLUMN lastHeartbeat TEXT DEFAULT NULL`).run();
  } catch (err) {
    // Column already exists, ignore error
    // SQLite error messages vary, so we check for common patterns
    if (!err.message.includes('duplicate column') && !err.message.includes('duplicate column name')) {
      console.error('Error adding lastHeartbeat column:', err.message);
    }
  }
 
  // employees table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS employees (
      userId INTEGER PRIMARY KEY,
      eventId INTEGER,
      stationId INTEGER,
      encryptedPassword TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(stationId) REFERENCES stations(id) ON DELETE CASCADE
    ) STRICT
  `).run();
  
  // Add encryptedPassword column if it doesn't exist (migration)
  try {
    db.prepare("ALTER TABLE employees ADD COLUMN encryptedPassword TEXT").run();
  } catch (err) {
    // Column already exists, ignore error
  }

  // groepspot table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS groepspot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creatorId INTEGER NOT NULL,
      eventId INTEGER,
      totalAmount INTEGER NOT NULL,
      remainingAmount INTEGER NOT NULL,
      qrCode TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creatorId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE
    ) STRICT
  `).run();

  // groepspot_contributions table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS groepspot_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groepspotId INTEGER NOT NULL,
      contributorId INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(groepspotId) REFERENCES groepspot(id) ON DELETE CASCADE,
      FOREIGN KEY(contributorId) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT
  `).run();

  // groepspot_items table (to store which items are in the groepspot)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS groepspot_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groepspotId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      itemName TEXT NOT NULL,
      itemPrice INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(groepspotId) REFERENCES groepspot(id) ON DELETE CASCADE,
      FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE SET NULL
    ) STRICT
  `).run();

  // festcoins_transactions table (for buy/sell/share/groepspot operations)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS festcoins_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      relatedUserId INTEGER,
      groepspotId INTEGER,
      description TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(relatedUserId) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(groepspotId) REFERENCES groepspot(id) ON DELETE SET NULL
    ) STRICT
  `).run();

  // budget_alarms table (for budget alerts per category)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS budget_alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      category TEXT NOT NULL,
      budgetLimit INTEGER NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, category)
    ) STRICT
  `).run();

  // user_points table (for loyalty points system)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS user_points (
      userId INTEGER PRIMARY KEY,
      currentPoints INTEGER DEFAULT 0,
      totalPointsEarned INTEGER DEFAULT 0,
      totalRewardsClaimed INTEGER DEFAULT 0,
      lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT
  `).run();
  
  // voor id
  const row = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'users'").get();
  if (!row) {
      db.prepare("INSERT INTO sqlite_sequence(name, seq) VALUES('users', 2426909)").run();
  }
}



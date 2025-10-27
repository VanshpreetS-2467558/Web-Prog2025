import Database from "better-sqlite3";

export const db = new Database("database.db", { verbose: console.log });

export function InitializeDatabase() { // moet async als we gaan hashen (met bcrypt?)
  db.pragma("journal_mode = WAL;");
  db.pragma("busy_timeout = 5000;");
  db.pragma("synchronous = NORMAL;");
  db.pragma("cache_size = 1000000000;");
  db.pragma("foreign_keys = true;");
  db.pragma("temp_store = memory;");

 db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    FestCoins INTEGER DEFAULT NULL
  ) STRICT
`).run();
}

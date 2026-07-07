const Database = require('better-sqlite3');
const db = new Database('database.db');
const session = db.prepare("SELECT id FROM sessions WHERE username = 'CyberRider95'").get();
console.log(session.id);

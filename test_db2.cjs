const Database = require('better-sqlite3');
const db = new Database('database.db');
const users = db.prepare("SELECT username, color, avatar, expiresAt FROM sessions WHERE username LIKE ? AND username != ? LIMIT 10").all('%QuantumWolf27%', 'CyberRider95');
console.log(users);

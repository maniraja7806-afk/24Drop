const Database = require('better-sqlite3');
const db = new Database('database.db');
console.log(db.prepare('SELECT username FROM sessions').all());
console.log(db.prepare('SELECT username FROM posts').all());

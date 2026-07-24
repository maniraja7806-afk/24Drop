const db = require('better-sqlite3')('database.db');
console.log(db.prepare('SELECT username FROM sessions;').all());

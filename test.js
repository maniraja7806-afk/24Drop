const db = require('better-sqlite3')('database.sqlite');
console.log(db.prepare('SELECT username FROM sessions;').all());

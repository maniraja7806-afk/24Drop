const Database = require('better-sqlite3');
const db = new Database('database.db');
try {
  db.prepare('ALTER TABLE messages ADD COLUMN seenAt DATETIME').run();
  console.log('Added seenAt column.');
} catch (e) {
  console.log('Error adding column (might already exist):', e.message);
}

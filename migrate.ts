import Database from 'better-sqlite3';
const db = new Database('database.db');
try {
  db.prepare('ALTER TABLE messages ADD COLUMN parentId TEXT').run();
  console.log('Added parentId to messages');
} catch (e: any) {
  console.log('Skipped adding parentId to messages:', e.message);
}

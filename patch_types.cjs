const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  "const expiredPosts = db.prepare('SELECT fileUrl FROM posts WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now);",
  "const expiredPosts = db.prepare('SELECT fileUrl FROM posts WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now) as any[];"
);
code = code.replace(
  "const expiredMsgs = db.prepare('SELECT fileUrl FROM messages WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now);",
  "const expiredMsgs = db.prepare('SELECT fileUrl FROM messages WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now) as any[];"
);
fs.writeFileSync('server.ts', code);

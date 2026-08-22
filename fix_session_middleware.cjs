const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const sessionId = req.headers['x-session-id'];",
  "const sessionId = req.headers['x-session-id'] || req.query.sessionId;"
);

fs.writeFileSync(file, code);

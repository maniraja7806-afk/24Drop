const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("const users = stmt.all(`%${query}%`, req.session.username);", "const users = stmt.all(`%${query}%`, req.session.username);\n    console.log('Search query:', query, 'Result length:', users.length);");
fs.writeFileSync('server.ts', code);

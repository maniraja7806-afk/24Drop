const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/fileUrl = result\.secure_url;/g, 'fileUrl = (result as any).secure_url;');
fs.writeFileSync('server.ts', code);

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/fileSize: 25 \* 1024 \* 1024 \* 1024/g, "fileSize: 30 * 1024 * 1024");
code = code.replace(/25GB limit/g, "30MB limit");

fs.writeFileSync('server.ts', code);

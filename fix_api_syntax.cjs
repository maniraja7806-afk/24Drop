const fs = require('fs');
const file = 'src/lib/api.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('\\n', '\n');

fs.writeFileSync(file, code);

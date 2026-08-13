const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(/\n\)}\n\)}/g, '\n)}');

fs.writeFileSync('src/components/MainApp.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace('<div className="p-4">', '<div className="p-4 relative z-50">');
fs.writeFileSync('src/components/MainApp.tsx', code);

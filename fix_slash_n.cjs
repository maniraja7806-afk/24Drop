const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(/&& \(\\n<button/g, '&& (\n<button');

fs.writeFileSync('src/components/MainApp.tsx', code);

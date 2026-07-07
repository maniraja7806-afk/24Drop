const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldStr = 'activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden group-hover:flex"';
const newStr = 'activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden"';

code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched to remove group-hover:flex from quick emoji row.");

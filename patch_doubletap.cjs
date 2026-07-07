const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace("toggleReaction(msg.id, '❤️');", "toggleReaction(msg.id, quickEmojis[0] || '❤️');");

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched double tap emoji.");

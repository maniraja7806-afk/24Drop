const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace('{Array.from(new Set(quickEmojis)).slice(0, 6).map(emoji => (', '{Array.from(new Set(quickEmojis)).slice(0, 6).map((emoji: any) => (');

fs.writeFileSync('src/components/MainApp.tsx', code);

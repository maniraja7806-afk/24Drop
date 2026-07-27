const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<nav className="p-2 space-y-1">/g,
  '<nav className="flex-1 overflow-y-auto p-2 space-y-1">'
);

fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<div className="whitespace-pre-wrap">/g,
  '<div className="whitespace-pre-wrap break-words">'
);

fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<p className="text-neutral-200 text-\[15px\] leading-relaxed mb-4 whitespace-pre-wrap">/g,
  '<p className="text-neutral-200 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap break-words">'
);

fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Composer Footer wrapper
content = content.replace(
  /<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950\/90 to-transparent">/g,
  '<div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent">'
);

fs.writeFileSync(file, content);

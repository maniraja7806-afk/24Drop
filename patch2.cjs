const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Sidebar layout
content = content.replace(
  /"w-full md:w-80 bg-neutral-900 border-b md:border-b-0 md:border-r border-white\/10 flex-col flex-shrink-0",\s*view === 'chat' \? 'hidden md:flex' : 'flex'/g,
  '"w-full md:w-80 bg-neutral-900 border-b md:border-b-0 md:border-r border-white/10 flex-col flex-shrink-0",\n        mobileShowSidebar ? \'flex\' : \'hidden md:flex\''
);

fs.writeFileSync(file, content);

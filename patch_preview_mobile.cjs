const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(
  'className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"',
  'className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90"'
);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched file preview mobile");

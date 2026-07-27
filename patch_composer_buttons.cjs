const fs = require('fs');
const file = 'src/components/Composer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Attachment button
content = content.replace(
  /className=\{clsx\("w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white\/10 transition-colors", isMenuOpen && "bg-white\/10 text-white"\)\}/g,
  'className={clsx("w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors", isMenuOpen && "bg-white/10 text-white")}'
);

// Mic button
content = content.replace(
  /className=\{clsx\(\s*"p-1.5 transition-colors cursor-pointer rounded-full overflow-hidden flex items-center justify-center",\s*"text-neutral-400 hover:text-white"\s*\)\}/g,
  'className={clsx("p-2 md:p-1.5 transition-colors cursor-pointer rounded-full overflow-hidden flex items-center justify-center", "text-neutral-400 hover:text-white")}'
);

fs.writeFileSync(file, content);

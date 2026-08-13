const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(
  /<div className="flex justify-between items-center p-4 bg-gradient-to-b from-black\/50 to-transparent absolute top-0 left-0 right-0 z-10">[\s\S]*?<X className="w-6 h-6" \/>\s*<\/button>\s*<\/div>/,
  `<div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-10">
              <button aria-label="Close camera" onClick={closeCamera} className="text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>`
);

fs.writeFileSync('src/components/MainApp.tsx', code);

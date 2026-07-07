const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// For the main scrollable area, the padding was p-6
code = code.replace('<div className="flex-1 overflow-y-auto p-6 space-y-6"', '<div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-24 space-y-6"');

// And remove the pb-32 from the individual views
code = code.replace('<div className="space-y-6 max-w-2xl mx-auto pb-32">', '<div className="space-y-6 max-w-2xl mx-auto">');
code = code.replace('<div className="flex flex-col space-y-4 max-w-3xl mx-auto pb-32">', '<div className="flex flex-col space-y-4 max-w-3xl mx-auto">');

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched padding!");

const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldCode = `                    className="flex-1 bg-[#212121] rounded-[24px] flex flex-col items-center justify-center py-4 shadow-2xl relative overflow-hidden"`;
const newCode = `                    className="flex-1 bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/MainApp.tsx', code);

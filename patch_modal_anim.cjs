const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldModalRow = `                      className={clsx(
                        "w-11 h-11 flex items-center justify-center rounded-full text-2xl transition-all transform",
                        isCustomizing ? "bg-neutral-800 hover:bg-neutral-700 border border-white/5 relative group" : "hover:bg-white/10 hover:scale-110"
                      )}`;
                      
const newModalRow = `                      className={clsx(
                        "w-11 h-11 flex items-center justify-center rounded-full text-2xl transition-all transform active:scale-90",
                        isCustomizing ? "bg-neutral-800 hover:bg-neutral-700 border border-white/5 relative group" : "hover:bg-white/10 hover:scale-110"
                      )}`;

code = code.replace(oldModalRow, newModalRow);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched modal anim");

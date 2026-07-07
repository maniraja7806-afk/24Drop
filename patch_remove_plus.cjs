const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const targetStr = `                        <div className="relative">
                          <button onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); }} className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>`;

code = code.replace(targetStr, "");
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched to remove standalone plus button.");

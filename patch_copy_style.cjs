const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldStr = `{msg.content && (
                          <button 
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}`;

const newStr = `{msg.content && (
                          <button 
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-2 text-neutral-400 hover:text-white bg-[#262626] rounded-full transition-colors ml-1 border border-white/5 shadow-sm"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched copy style.");

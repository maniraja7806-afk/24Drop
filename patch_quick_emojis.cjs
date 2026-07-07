const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldCode = `                          {quickEmojis.map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-lg transition-colors hover:scale-110 transform"
                            >
                              {emoji}
                            </button>
                          ))}`;

const newCode = `                          {Array.from(new Set(quickEmojis)).slice(0, 6).map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-lg transition-colors hover:scale-110 transform"
                            >
                              {emoji}
                            </button>
                          ))}`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched quick emojis duplicate fix.");

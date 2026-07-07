const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldStr = `{/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden", isMe ? "right-0" : "left-0")}>
                          {Array.from(new Set(quickEmojis)).slice(0, 6).map((emoji: any) => (
                            <button 
                              key={emoji}
                              onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-lg transition-colors hover:scale-110 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-px h-5 bg-white/10 mx-1"></div>
                          <button 
                            onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors bg-neutral-700/50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>`;

const newStr = `{/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center bg-[#262626] px-1.5 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden", isMe ? "right-0" : "left-0")}>
                          {Array.from(new Set(quickEmojis)).slice(0, 6).map((emoji: any) => (
                            <button 
                              key={emoji}
                              onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1.5"></div>
                          <button 
                            onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}
                            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-neutral-400 hover:text-white transition-colors ml-0.5"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched Instagram style.");

const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldCode = `                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1.5", isMe ? "-left-[76px] flex-row-reverse space-x-reverse" : "-right-[76px]")}>
                        <div className="relative">
                          <button onClick={() => setActiveReactionMsg(activeReactionMsg === msg.id ? null : msg.id)} className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10">
                            <Plus className="w-4 h-4" />
                          </button>
                          {/* Reaction Menu */}
                          <AnimatePresence>
                          {activeReactionMsg === msg.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className={clsx("absolute bottom-full mb-2 flex items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50", isMe ? "right-0" : "left-0")}
                            >
                              {quickEmojis.map(emoji => (
                                <button 
                                  key={emoji}
                                  onClick={() => { toggleReaction(msg.id, emoji); setActiveReactionMsg(null); }}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-2xl transition-colors hover:scale-110 transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                              <div className="w-px h-6 bg-white/10 mx-1"></div>
                              <button 
                                onClick={() => { setActiveReactionMsgFull(msg.id); setActiveReactionMsg(null); setIsCustomizing(false); }}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors bg-neutral-700/50"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </motion.div>
                          )}
                          </AnimatePresence>
                        </div>`;

const newCode = `                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1.5", isMe ? "-left-[76px] flex-row-reverse space-x-reverse" : "-right-[76px]")}>
                        <div className={clsx("absolute bottom-full mb-2 hidden group-hover:flex items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50", isMe ? "right-0" : "left-0")}>
                          {quickEmojis.map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-lg transition-colors hover:scale-110 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-px h-5 bg-white/10 mx-1"></div>
                          <button 
                            onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors bg-neutral-700/50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="relative">
                          <button onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); }} className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched inline menu.");

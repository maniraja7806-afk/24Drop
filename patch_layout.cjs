const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const targetStr = `                    <div className={clsx("flex items-end space-x-2 relative", isMe && "flex-row-reverse space-x-reverse")}>
                      <div 
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          toggleReaction(msg.id, '❤️');
                        }}
                        className={clsx(
                          "px-4 py-2.5 rounded-2xl text-[15px] relative transition-transform active:scale-[0.98]",
                          isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                        )}
                      >
                        {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                        {msg.fileUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            {msg.fileType?.startsWith('image/') ? (
                              <img src={msg.fileUrl} alt="attachment" className="max-w-full rounded-md cursor-pointer" onClick={() => setViewingImage(msg.fileUrl)} />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline opacity-80">{msg.fileName}</a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions (Reactions & Copy) */}
                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1", isMe ? "right-full mr-2" : "left-full ml-2")}>
                        {/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden group-hover:flex", isMe ? "right-0" : "left-0")}>
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
                        </div>
                        
                        
                        
                        {msg.content && (
                          <button 
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10 transition-colors"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>`;

const newStr = `                    <div className={clsx("flex items-end space-x-2 relative", isMe && "flex-row-reverse space-x-reverse")}>
                      <div className="relative">
                        <div 
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            toggleReaction(msg.id, '❤️');
                          }}
                          className={clsx(
                            "px-4 py-2.5 rounded-2xl text-[15px] relative transition-transform active:scale-[0.98]",
                            isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                          )}
                        >
                          {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                          {msg.fileUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden">
                              {msg.fileType?.startsWith('image/') ? (
                                <img src={msg.fileUrl} alt="attachment" className="max-w-full rounded-md cursor-pointer" onClick={() => setViewingImage(msg.fileUrl)} />
                              ) : (
                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline opacity-80">{msg.fileName}</a>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden group-hover:flex", isMe ? "right-0" : "left-0")}>
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
                        </div>
                      </div>

                      {/* Quick Actions (Copy) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center mb-1">
                        {msg.content && (
                          <button 
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched layout");

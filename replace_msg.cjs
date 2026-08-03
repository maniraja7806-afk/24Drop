const fs = require('fs');
let content = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const target = `
                        className={clsx(
                          "px-4 py-2.5 rounded-2xl text-[15px] relative transition-transform active:scale-[0.98]",
                          isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                        )}
                      >
                        {msg.content && <div className="whitespace-pre-wrap break-words">{highlightText(msg.content, chatSearchQuery)}</div>}
                        {msg.fileUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            {msg.fileType?.startsWith('image/') ? (
                              <img loading="lazy" src={msg.fileUrl} alt="attachment" className="max-w-full max-h-96 object-contain rounded-md cursor-pointer" onClick={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })} />
                            ) : msg.fileType?.startsWith('audio/') ? (
                              <AudioPlayer src={msg.fileUrl} />
                            ) : (
                              <button onClick={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })} className="underline opacity-80 hover:opacity-100 flex items-center space-x-2 text-left">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span className="truncate">{msg.fileName}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions (Reactions & Copy) */}
                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1", isMe ? "right-full mr-2" : "left-full ml-2")}>
                        {/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center bg-[#262626] px-1.5 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden", isMe ? "right-0" : "left-0")}>
                          {Array.from(new Set(quickEmojis)).slice(0, 6).map((emoji: any) => (
                            <button 
                              key={emoji}
                              aria-label={\`React with \${emoji}\`}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 active:scale-75 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1.5"></div>
                          <button 
                            aria-label="More reactions"
                            onClick={(e) => { e.stopPropagation(); setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}
                            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-neutral-400 hover:text-white transition-colors ml-0.5"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        

                        
                        {msg.content && (
                          <button 
                            aria-label="Copy message text"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10 transition-colors"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          aria-label={msg.isPinned ? "Unpin message" : "Pin message"}
                          onClick={() => togglePin(msg.id)}
                          className={clsx("p-1.5 rounded-full shadow-md border border-white/10 transition-colors", msg.isPinned ? "text-blue-400 bg-blue-900/20 border-blue-500/30" : "text-neutral-500 hover:text-white bg-neutral-900")}
                          title={msg.isPinned ? "Unpin message" : "Pin message"}
                        >
                          {msg.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Reactions Display */}
`;

const replacement = `
                        className={clsx(
                          "px-4 py-2.5 rounded-2xl text-[15px] relative transition-transform active:scale-[0.98] group/bubble",
                          isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                        )}
                      >
                        {isMe && (
                          <button
                            aria-label="Delete message"
                            onClick={() => deleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-full shadow-md transition-all z-10"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {msg.content && (
                          <div className="whitespace-pre-wrap break-words">
                            {highlightText(msg.content, chatSearchQuery)}
                            {msg.isEdited === 1 && <span className="text-[10px] opacity-60 ml-2">(edited)</span>}
                          </div>
                        )}
                        {msg.fileUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            {msg.fileType?.startsWith('image/') ? (
                              <img loading="lazy" src={msg.fileUrl} alt="attachment" className="max-w-full max-h-96 object-contain rounded-md cursor-pointer" onClick={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })} />
                            ) : msg.fileType?.startsWith('audio/') ? (
                              <AudioPlayer src={msg.fileUrl} />
                            ) : (
                              <button onClick={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })} className="underline opacity-80 hover:opacity-100 flex items-center space-x-2 text-left">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span className="truncate">{msg.fileName}</span>
                              </button>
                            )}
                          </div>
                        )}
                        
                        {editingMessageId === msg.id && (
                          <div className="mt-2 w-full">
                            <textarea
                              value={editMessageContent}
                              onChange={(e) => setEditMessageContent(e.target.value)}
                              className={clsx(
                                "w-full p-2 text-sm rounded-md border focus:outline-none focus:ring-2 resize-none",
                                isMe ? "bg-black/5 border-black/10 text-black focus:ring-black/20" : "bg-white/5 border-white/10 text-white focus:ring-white/20"
                              )}
                              rows={3}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <button onClick={() => setEditingMessageId(null)} className={clsx("px-3 py-1.5 text-xs font-medium rounded-md", isMe ? "bg-black/10 hover:bg-black/20 text-black" : "bg-white/10 hover:bg-white/20 text-white")}>
                                Cancel
                              </button>
                              <button onClick={() => saveEdit(msg.id)} className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions (Reactions) */}
                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1", isMe ? "right-full mr-2" : "left-full ml-2")}>
                        {/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center bg-[#262626] px-1.5 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden", isMe ? "right-0" : "left-0")}>
                          {Array.from(new Set(quickEmojis)).slice(0, 6).map((emoji: any) => (
                            <button 
                              key={emoji}
                              aria-label={\`React with \${emoji}\`}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 active:scale-75 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1.5"></div>
                          <button 
                            aria-label="More reactions"
                            onClick={(e) => { e.stopPropagation(); setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}
                            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-neutral-400 hover:text-white transition-colors ml-0.5"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <button 
                          aria-label={msg.isPinned ? "Unpin message" : "Pin message"}
                          onClick={() => togglePin(msg.id)}
                          className={clsx("p-1.5 rounded-full shadow-md border border-white/10 transition-colors", msg.isPinned ? "text-blue-400 bg-blue-900/20 border-blue-500/30" : "text-neutral-500 hover:text-white bg-neutral-900")}
                          title={msg.isPinned ? "Unpin message" : "Pin message"}
                        >
                          {msg.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Persistent Actions (Copy & Edit) */}
                    <div className={clsx("flex items-center space-x-2 mt-1 px-1", isMe ? "justify-end" : "justify-start")}>
                      {msg.content && (
                        <button 
                          aria-label="Copy message text"
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="flex items-center space-x-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          title="Copy message text"
                        >
                          {copiedMessageId === msg.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy</span>
                        </button>
                      )}
                      {isMe && msg.content && (
                        <button 
                          aria-label="Edit message"
                          onClick={() => startEditing(msg)}
                          className="flex items-center space-x-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          title="Edit message"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Reactions Display */}
`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/MainApp.tsx', content);
  console.log('Successfully replaced the message block.');
} else {
  console.log('Target not found in file.');
}

const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const modalCode = `
      {/* Customize Emojis Modal */}
      <AnimatePresence>
        {isCustomizingEmojis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setIsCustomizingEmojis(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-sm w-full"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-medium text-white">Customize Reactions</h3>
                <button onClick={() => setIsCustomizingEmojis(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 bg-neutral-800">
                <p className="text-sm text-neutral-400 mb-3 text-center">Click an emoji below to add it to your quick reactions.</p>
                <div className="flex items-center justify-center space-x-2">
                  {quickEmojis.map((emoji, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        const newEmojis = quickEmojis.filter((_, i) => i !== idx);
                        setQuickEmojis(newEmojis);
                        localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-neutral-900 hover:bg-neutral-700 rounded-full text-xl transition-colors border border-white/5 group relative"
                    >
                      {emoji}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    </button>
                  ))}
                  {quickEmojis.length < 6 && (
                    <div className="w-10 h-10 flex items-center justify-center border border-dashed border-neutral-600 rounded-full text-neutral-500">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-0">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData) => {
                    if (quickEmojis.length < 6) {
                      const newEmojis = [...quickEmojis, emojiData.emoji];
                      setQuickEmojis(newEmojis);
                      localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                    } else {
                      const newEmojis = [...quickEmojis.slice(1), emojiData.emoji];
                      setQuickEmojis(newEmojis);
                      localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                    }
                  }}
                  width="100%"
                  height="400px"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace("      </AnimatePresence>\n    </div>\n    </>\n  );\n}", modalCode + "      </AnimatePresence>\n    </div>\n    </>\n  );\n}");
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched modal.");

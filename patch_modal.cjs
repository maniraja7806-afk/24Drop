const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Replace activeReactionMsg string
const addState = `
  const [activeReactionMsgFull, setActiveReactionMsgFull] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
`;
if (!code.includes('activeReactionMsgFull')) {
  code = code.replace("const [isCustomizingEmojis, setIsCustomizingEmojis] = useState(false);", "const [isCustomizingEmojis, setIsCustomizingEmojis] = useState(false);\n" + addState);
}

// Fix the bubble menu to use + instead of Sparkles
const oldBubble = `                              <button 
                                onClick={() => { setIsCustomizingEmojis(true); setActiveReactionMsg(null); }}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                              >
                                <Sparkles className="w-5 h-5" />
                              </button>`;
const newBubble = `                              <button 
                                onClick={() => { setActiveReactionMsgFull(msg.id); setActiveReactionMsg(null); setIsCustomizing(false); }}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors bg-neutral-700/50"
                              >
                                <Plus className="w-5 h-5" />
                              </button>`;
code = code.replace(oldBubble, newBubble);

// Fix the modal
const oldModalStart = `{/* Customize Emojis Modal */}`;
const oldModalEnd = `      </AnimatePresence>
    </div>
    </>
  );
}`;

const newModal = `      {/* Full Emoji Picker & Customization Modal */}
      <AnimatePresence>
        {activeReactionMsgFull && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm sm:p-4"
            onClick={() => { setActiveReactionMsgFull(null); setIsCustomizing(false); }}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border-t sm:border border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full sm:max-w-sm"
              style={{ maxHeight: "85vh" }}
            >
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">Your reactions</h3>
                <button 
                  onClick={() => setIsCustomizing(!isCustomizing)} 
                  className={clsx("text-sm font-medium", isCustomizing ? "text-blue-400" : "text-blue-500 hover:text-blue-400")}
                >
                  {isCustomizing ? "Done" : "Customize"}
                </button>
              </div>
              
              <div className="px-4 pb-4 border-b border-white/10">
                {isCustomizing && <p className="text-xs text-neutral-400 mb-2">Click an emoji to remove it, or pick below to add.</p>}
                <div className="flex items-center justify-between space-x-1">
                  {quickEmojis.map((emoji, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (isCustomizing) {
                          const newEmojis = quickEmojis.filter((_, i) => i !== idx);
                          setQuickEmojis(newEmojis);
                          localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                        } else {
                          toggleReaction(activeReactionMsgFull, emoji);
                          setActiveReactionMsgFull(null);
                        }
                      }}
                      className={clsx(
                        "w-11 h-11 flex items-center justify-center rounded-full text-2xl transition-all transform",
                        isCustomizing ? "bg-neutral-800 hover:bg-neutral-700 border border-white/5 relative group" : "hover:bg-white/10 hover:scale-110"
                      )}
                    >
                      {emoji}
                      {isCustomizing && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                  {isCustomizing && quickEmojis.length < 6 && (
                    <div className="w-11 h-11 flex flex-1 items-center justify-center border border-dashed border-neutral-600 rounded-full text-neutral-500">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-0 overflow-hidden flex-1 bg-neutral-900">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData) => {
                    if (isCustomizing) {
                      if (quickEmojis.length < 6) {
                        const newEmojis = [...quickEmojis, emojiData.emoji];
                        setQuickEmojis(newEmojis);
                        localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                      } else {
                        const newEmojis = [...quickEmojis.slice(1), emojiData.emoji];
                        setQuickEmojis(newEmojis);
                        localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                      }
                    } else {
                      toggleReaction(activeReactionMsgFull, emojiData.emoji);
                      setActiveReactionMsgFull(null);
                    }
                  }}
                  width="100%"
                  height="400px"
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}`;

const startIndex = code.indexOf(oldModalStart);
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + newModal;
  fs.writeFileSync('src/components/MainApp.tsx', code);
  console.log("Patched modal.");
} else {
  console.log("Could not find modal start.");
}


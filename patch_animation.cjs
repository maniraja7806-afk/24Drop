const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Update reaction display on messages
const oldReactionDisplay = `                            className={clsx(
                              "flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10",
                              reacted ? "bg-white/20 text-white" : "bg-neutral-900 text-neutral-300 hover:bg-white/10"
                            )}`;
const newReactionDisplay = `                            className={clsx(
                              "flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 transition-transform active:scale-90",
                              reacted ? "bg-white/20 text-white" : "bg-neutral-900 text-neutral-300 hover:bg-white/10"
                            )}`;

code = code.replace(oldReactionDisplay, newReactionDisplay);

// Update quick action hover row
const oldQuickRow = `                            <button 
                              key={emoji}
                              onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 transform"
                            >`;
const newQuickRow = `                            <button 
                              key={emoji}
                              onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 active:scale-75 transform"
                            >`;

code = code.replace(oldQuickRow, newQuickRow);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched animations");

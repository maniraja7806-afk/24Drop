const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldBubbleStart = `                      <div className={clsx(
                        "px-4 py-2.5 rounded-2xl text-[15px] relative",
                        isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                      )}>`;

const newBubbleStart = `                      <div 
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          toggleReaction(msg.id, '❤️');
                        }}
                        className={clsx(
                          "px-4 py-2.5 rounded-2xl text-[15px] relative transition-transform active:scale-[0.98]",
                          isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                        )}
                      >`;

code = code.replace(oldBubbleStart, newBubbleStart);

const oldQuickActions = `                      {/* Quick Actions (Reactions & Copy) */}
                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1.5", isMe ? "-left-[76px] flex-row-reverse space-x-reverse" : "-right-[76px]")}>
                        <div className={clsx("absolute bottom-full mb-2 hidden group-hover:flex items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50", isMe ? "right-0" : "left-0")}>`;

const newQuickActions = `                      {/* Quick Actions (Reactions & Copy) */}
                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1.5", isMe ? "-left-[76px] flex-row-reverse space-x-reverse" : "-right-[76px]")}>
                        {/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 hidden group-hover:flex items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50", isMe ? "right-0" : "left-0")}>`;

code = code.replace(oldQuickActions, newQuickActions);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched message double tap.");

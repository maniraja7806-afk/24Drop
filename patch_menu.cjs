const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const stateAdd = `  const [activeMenuMsg, setActiveMenuMsg] = useState<string | null>(null);`;
code = code.replace("const [activeReactionMsgFull, setActiveReactionMsgFull] = useState<string | null>(null);", "const [activeReactionMsgFull, setActiveReactionMsgFull] = useState<string | null>(null);\n" + stateAdd);

const oldMsgContainer = `<div key={msg.id} className={clsx("flex flex-col max-w-[80%] group", isMe ? "self-end items-end" : "self-start items-start")}>`;
const newMsgContainer = `<div 
                    key={msg.id} 
                    className={clsx("flex flex-col max-w-[80%] group", isMe ? "self-end items-end" : "self-start items-start")}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuMsg(activeMenuMsg === msg.id ? null : msg.id);
                    }}
                  >`;
code = code.replace(oldMsgContainer, newMsgContainer);

const oldQuickActions = `{/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 hidden group-hover:flex items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50", isMe ? "right-0" : "left-0")}>`;
const newQuickActions = `{/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center space-x-1 bg-neutral-800 border border-white/10 p-1.5 rounded-full shadow-xl z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden group-hover:flex", isMe ? "right-0" : "left-0")}>`;
code = code.replace(oldQuickActions, newQuickActions);

const toggleReactionFix = `                              onClick={() => toggleReaction(msg.id, emoji)}`;
const toggleReactionFixNew = `                              onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}`;
code = code.replace(toggleReactionFix, toggleReactionFixNew);

const plusBtnFix = `onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); }}`;
const plusBtnFixNew = `onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}`;
code = code.replace(plusBtnFix, plusBtnFixNew);

// In case there are multiple toggleReaction fixes needed in quick emojis
code = code.replaceAll(`onClick={() => toggleReaction(msg.id, emoji)}`, `onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}`);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched long press menu.");

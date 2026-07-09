const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// add import
code = code.replace("import { AudioPlayer } from './AudioPlayer';", "import { AudioPlayer } from './AudioPlayer';\nimport { DissolvingItem } from './DissolvingItem';");

// replace post motion.div
code = code.replace(
  '<motion.div \n                  initial={{ opacity: 0, y: 10 }}\n                  animate={{ opacity: 1, y: 0 }}\n                  key={post.id} \n                  className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl relative group"\n                >',
  '<DissolvingItem \n                  initial={{ opacity: 0, y: 10 }}\n                  animate={{ opacity: 1, y: 0 }}\n                  key={post.id} \n                  expiresAt={post.expiresAt}\n                  className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl relative group"\n                >'
);

// wait, post.id ends the block with </motion.div>.
code = code.replace(
  '                  )} \n                </motion.div>\n              ))}',
  '                  )} \n                </DissolvingItem>\n              ))}'
);

// replace message <div className={clsx("flex flex-col max-w-[80%] group"...
const oldMsgStart = `<div 
                    key={msg.id} 
                    className={clsx("flex flex-col max-w-[80%] group", isMe ? "self-end items-end" : "self-start items-start")}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuMsg(activeMenuMsg === msg.id ? null : msg.id);
                    }}
                  >`;

const newMsgStart = `<DissolvingItem 
                    key={msg.id} 
                    expiresAt={msg.expiresAt}
                    className={clsx("flex flex-col max-w-[80%] group", isMe ? "self-end items-end" : "self-start items-start")}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuMsg(activeMenuMsg === msg.id ? null : msg.id);
                    }}
                  >`;

code = code.replace(oldMsgStart, newMsgStart);

// need to close DissolvingItem instead of div for messages.
const oldMsgEnd = `                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />`;

const newMsgEnd = `                    </div>
                  </DissolvingItem>
                );
              })}
              <div ref={messagesEndRef} />`;

code = code.replace(oldMsgEnd, newMsgEnd);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched dissolve");

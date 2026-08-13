const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Replace Delete post
let target = `<button 
                          aria-label="Delete post"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePost(post.id);
                          }}
                          className="p-1.5 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white border border-white/10 rounded-full shadow-md transition-all flex items-center justify-center hover:scale-110 active:scale-95"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>`;

code = code.replace(target, `{post.username === session?.username && (
${target}
)}`);

// Replace Edit post
target = `<button 
                        aria-label="Edit post"
                        onClick={() => startEditing(post)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/5 bg-neutral-950/60 shadow-sm"
                        title="Edit post"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>`;
                      
code = code.replace(target, `{post.username === session?.username && (
${target}
)}`);

// Replace Delete message
target = `<button
                              aria-label="Delete message"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(msg.id);
                              }}
                              className="p-1.5 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white border border-white/10 rounded-full shadow-md transition-all flex items-center justify-center hover:scale-110 active:scale-95"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`;
                            
code = code.replace(target, `{isMe && (
${target}
)}`);


// Replace Edit message
target = `<button 
                        aria-label="Edit message"
                        onClick={() => startEditing(msg)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/5 bg-neutral-900/60 shadow-sm"
                        title="Edit message"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>`;
                      
code = code.replace(target, `{isMe && (
${target}
)}`);

fs.writeFileSync('src/components/MainApp.tsx', code);

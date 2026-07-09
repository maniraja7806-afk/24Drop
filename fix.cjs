const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// For posts, the old code has:
//                  )}
//                </motion.div>
//              ))}
//              {posts.length === 0 && (

code = code.replace(
  '                  )}\n                </motion.div>\n              ))}\n              {posts.length === 0',
  '                  )}\n                </DissolvingItem>\n              ))}\n              {posts.length === 0'
);

// For messages, the old code has:
//                    </div>
//                  </motion.div>
//                );
//              })}
//              <div ref={messagesEndRef} />

code = code.replace(
  '                    </div>\n                  </motion.div>\n                );\n              })}',
  '                    </div>\n                  </DissolvingItem>\n                );\n              })}'
);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Fixed");

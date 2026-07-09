const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(
  '                  )} \n                </motion.div>\n              ))}',
  '                  )} \n                </DissolvingItem>\n              ))}'
);

// wait, let's just do a string replace for the </motion.div> for posts
code = code.replace(
  '                  </motion.div>\n                ))}\n                {posts.length === 0',
  '                  </DissolvingItem>\n                ))}\n                {posts.length === 0'
);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched dissolve again");

const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldStr = `className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1.5", isMe ? "-left-[76px] flex-row-reverse space-x-reverse" : "-right-[76px]")}`;
const newStr = `className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1", isMe ? "right-full mr-2" : "left-full ml-2")}`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched margin");

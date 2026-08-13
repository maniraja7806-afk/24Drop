const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(/{isMe && \(\s*\{isMe && \(\s*<button/g, '{isMe && (\\n<button');
code = code.replace(/{post\.username === session\?\.username && \(\s*\{post\.username === session\?\.username && \(\s*<button/g, '{post.username === session?.username && (\\n<button');

fs.writeFileSync('src/components/MainApp.tsx', code);

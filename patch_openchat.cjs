const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldOpenChat = `  const openChat = (username: string) => {
    setActiveChat(username);
    setView('chat');
    setSearchQuery('');
  };`;

const newOpenChat = `  const openChat = (username: string) => {
    setActiveChat(username);
    setView('chat');
    setSearchQuery('');
    setChatSearchQuery('');
  };`;

code = code.replace(oldOpenChat, newOpenChat);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched openChat!");

const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<nav className="flex-1 overflow-y-auto p-2 space-y-1">/g,
  '<PullToRefresh className="p-2 space-y-1" onRefresh={async () => { await fetchApi(\'/api/chats\').then(setChats); }}>'
);
content = content.replace(
  /<\/nav>/g,
  '</PullToRefresh>'
);

content = content.replace(
  /<div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-24 space-y-6" onClick=\{\(\) => setActiveMenuMsg\(null\)\} onScroll=\{\(\) => setActiveMenuMsg\(null\)\}>/g,
  `<PullToRefresh 
          className="px-4 md:px-6 pt-6 pb-24 space-y-6" 
          onClick={() => setActiveMenuMsg(null)} 
          onScroll={() => setActiveMenuMsg(null)}
          onRefresh={async () => {
            if (view === 'feed') await fetchApi('/api/posts').then(setPosts);
            else if (view === 'chat' && activeChat) await fetchApi(\`/api/messages/\${activeChat}\`).then(setMessages);
          }}
        >`
);

content = content.replace(
  /<\/div>\s*\{\/\* Composer Footer \*\/\}/g,
  '</PullToRefresh>\n        {/* Composer Footer */}'
);


fs.writeFileSync(file, content);

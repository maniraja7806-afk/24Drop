const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');
code = code.replace(/href=\{viewingFile\.downloadUrl \|\| viewingFile\.url\}/, "href={viewingFile.downloadUrl || `/api/proxy-download?url=${encodeURIComponent(viewingFile.url)}&filename=${encodeURIComponent(viewingFile.name)}${localStorage.getItem('sessionId') ? `&sessionId=${localStorage.getItem('sessionId')}` : ''}`}");
fs.writeFileSync('src/components/MainApp.tsx', code);

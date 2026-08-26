const fs = require('fs');
let code = fs.readFileSync('src/components/FileAttachmentView.tsx', 'utf8');
code = code.replaceAll("href={`/api/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(name)}${sessionId ?  : ''}`}", "href={`/api/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(name)}${sessionId ? `&sessionId=${sessionId}` : ''}`}");
fs.writeFileSync('src/components/FileAttachmentView.tsx', code);

const fs = require('fs');
const file = 'src/components/FileAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure sessionId is imported/read in FileAttachmentView
if (!code.includes("localStorage.getItem('sessionId')")) {
  code = code.replace(
    "const name = fileName || fileUrl.split('/').pop() || 'Attachment';",
    "const name = fileName || fileUrl.split('/').pop() || 'Attachment';\n  const sessionId = localStorage.getItem('sessionId');"
  );
}

code = code.replace(
  /href=\{fileUrl\}/g,
  "href={fileUrl + (fileUrl.includes('?') ? '&' : '?') + (sessionId ? `sessionId=${sessionId}` : '')}"
);

fs.writeFileSync(file, code);

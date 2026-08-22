const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const downloadUrl = isPost ? `/api/posts/${messageId}/download-folder` : `/api/messages/${messageId}/download-folder`;",
  "const sessionId = localStorage.getItem('sessionId');\n  const downloadUrl = (isPost ? `/api/posts/${messageId}/download-folder` : `/api/messages/${messageId}/download-folder`) + (sessionId ? `?sessionId=${sessionId}` : '');"
);

fs.writeFileSync(file, code);

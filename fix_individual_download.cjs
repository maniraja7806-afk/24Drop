const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// The user is getting "Missing session" when clicking the individual file download link.
// We already have `const sessionId = localStorage.getItem('sessionId');` at the top of the component.
// Let's replace `href={node.file.fileUrl}` and `href={file.fileUrl}` with a version that appends the sessionId query param just in case it hits a protected route.

code = code.replace(
  /href=\{node\.file\.fileUrl\}/g,
  "href={node.file.fileUrl + (node.file.fileUrl.includes('?') ? '&' : '?') + (sessionId ? `sessionId=${sessionId}` : '')}"
);

code = code.replace(
  /href=\{file\.fileUrl\}/g,
  "href={file.fileUrl + (file.fileUrl.includes('?') ? '&' : '?') + (sessionId ? `sessionId=${sessionId}` : '')}"
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '{isOpen && node.children && (\n        <div className="flex flex-col">',
  '{isOpen && node.children && (\n        <div className="flex flex-col gap-1">'
);

fs.writeFileSync(file, code);

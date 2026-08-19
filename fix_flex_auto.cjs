const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex-auto overflow-y-auto overflow-x-hidden min-h-0 p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace flex-1 with flex-auto, add pt-3, remove space-y-1, add gap-1
code = code.replace(
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-auto min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pt-3 pb-4 gap-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);

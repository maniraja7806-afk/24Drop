const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update modal container to remove flex-1
code = code.replace(
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[85vh] sm:max-h-[90vh]"',
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"'
);

// Update file list to have min-h-[240px]
code = code.replace(
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-1 min-h-[250px] overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);

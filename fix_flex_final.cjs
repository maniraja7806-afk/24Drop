const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Reset modal to perfect flex behavior:
code = code.replace(
  /className="bg-neutral-900 border border-white\/10 rounded-2xl w-full max-w-lg shadow-2xl[^"]*"/,
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[85vh] sm:max-h-[90vh]"'
);

// Check if File list is already correct:
if (!code.includes('className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"')) {
  code = code.replace(
    /className="flex flex-col flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"/,
    'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
  );
}

fs.writeFileSync(file, code);

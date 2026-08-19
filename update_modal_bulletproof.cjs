const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. The wrapper: fixed inset-0 flex items-center justify-center p-4
code = code.replace(
  /className="fixed inset-0 z-\[60\] flex flex-col items-center justify-center py-4 px-4 sm:p-8 bg-black\/60 backdrop-blur-sm overflow-hidden"/g,
  'className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"'
);

// 2. The modal itself: w-full max-w-lg max-h-[85vh] flex flex-col (remove flex-1 from it)
code = code.replace(
  /className="bg-neutral-900 border border-white\/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-\[1_1_auto\] min-h-0 max-h-full"/g,
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"'
);

// 3. The file list: flex-1 overflow-y-auto min-h-0
code = code.replace(
  /className="flex-\[1_1_auto\] min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"/g,
  'className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);

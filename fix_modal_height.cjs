const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. The wrapper
code = code.replace(
  'className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"',
  'className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-hidden"'
);

// 2. The Modal
// We want it to be able to grow, so we give it flex-1. This forces it to stretch vertically if needed, giving the file list a concrete height.
// We also constrain it to max-h-[85vh] just in case.
code = code.replace(
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"',
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[85vh] sm:max-h-[90vh]"'
);

// 3. The File List
// Exactly as requested: flex, flex-col, flex-1, min-h-0, overflow-y-auto
code = code.replace(
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);

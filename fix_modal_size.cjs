const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update modal container to have a default height
code = code.replace(
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"',
  'className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[65vh] min-h-[450px] max-h-[85vh] sm:max-h-[90vh]"'
);

// We can safely remove the min-h-[250px] from the file list and just let it flex-1 inside the newly taller modal
code = code.replace(
  'className="flex flex-col flex-1 min-h-[250px] overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"',
  'className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 pb-4 space-y-1 custom-scrollbar"'
);

fs.writeFileSync(file, code);

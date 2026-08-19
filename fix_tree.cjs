const fs = require('fs');
let code = fs.readFileSync('src/components/FolderAttachmentView.tsx', 'utf8');

const newImports = `import React, { useState } from 'react';
import { Download, Folder, Eye, X, FileText, FileArchive, FileCode, Video, Music, File, Search, ChevronRight, ChevronDown } from 'lucide-react';`;

code = code.replace(/import \{ Download,.*?\} from 'lucide-react';/, newImports);
if (!code.includes('useState')) {
    code = code.replace(/import React from 'react';/, `import React, { useState } from 'react';`);
}

fs.writeFileSync('src/components/FolderAttachmentView.tsx', code);

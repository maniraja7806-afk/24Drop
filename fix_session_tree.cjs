const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const [isOpen, setIsOpen] = useState(true);",
  "const [isOpen, setIsOpen] = useState(true);\n  const sessionId = localStorage.getItem('sessionId');"
);

fs.writeFileSync(file, code);

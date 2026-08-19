const fs = require('fs');
const file = 'src/components/FolderAttachmentView.tsx';
let code = fs.readFileSync(file, 'utf8');

const bodyLockEffect = `
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);
`;

if (!code.includes("document.body.style.overflow = 'hidden';")) {
  code = code.replace(
    "const [composerHeight, setComposerHeight] = useState(0);",
    "const [composerHeight, setComposerHeight] = useState(0);\n" + bodyLockEffect
  );
  fs.writeFileSync(file, code);
}

const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf-8');

const newState = `  const [viewingFile, setViewingFile] = useState<{url: string, type: string, name: string} | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    if (viewingFile) {
      setIsPreviewLoading(true);
      if (!viewingFile.type?.startsWith('image/') && viewingFile.type !== 'application/pdf' && !viewingFile.type?.startsWith('video/') && !viewingFile.type?.startsWith('audio/')) {
        setIsPreviewLoading(false);
      }
    }
  }, [viewingFile]);`;

code = code.replace(/  const \[viewingFile, setViewingFile\] = useState<\{url: string, type: string, name: string\} \| null>\(null\);\n  const \[isPreviewLoading, setIsPreviewLoading\] = useState\(true\);\n\n  useEffect\(\(\) => \{\n    if \(viewingFile\) setIsPreviewLoading\(true\);\n  \}, \[viewingFile\]\);/, newState);
fs.writeFileSync('src/components/MainApp.tsx', code);

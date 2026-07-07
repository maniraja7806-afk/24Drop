const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Update imports
code = code.replace("import React, { useState, useEffect, useRef }", "import React, { useState, useEffect, useRef, useMemo }");

// Add filePreviewUrl state/logic right after setFile
const fileState = `  const [file, setFile] = useState<File | null>(null);`;
const previewLogic = `  const [file, setFile] = useState<File | null>(null);

  const filePreviewUrl = useMemo(() => {
    if (file && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);`;

code = code.replace(fileState, previewLogic);

// Replace composer footer file preview
const oldFileUI = `{file && (
              <div className="mb-2 inline-flex items-center space-x-2 bg-[#212121] rounded-lg px-3 py-1.5 text-sm">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            )}`;

const newFileUI = `{file && (
              <div className="mb-2 relative inline-flex group items-end">
                {filePreviewUrl ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-neutral-900 shadow-xl ml-2">
                    <img src={filePreviewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[#212121] border border-white/10 rounded-xl flex flex-col items-center justify-center p-2 text-center shadow-xl ml-2">
                    <svg className="w-6 h-6 text-neutral-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px] text-neutral-300 truncate w-full px-1">{file.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => setFile(null)} 
                  className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}`;

code = code.replace(oldFileUI, newFileUI);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched file preview");

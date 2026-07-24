const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf-8');

const newState = `  const [viewingFile, setViewingFile] = useState<{url: string, type: string, name: string} | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    if (viewingFile) setIsPreviewLoading(true);
  }, [viewingFile]);`;

code = code.replace(/  const \[viewingFile, setViewingFile\] = useState<\{url: string, type: string, name: string\} \| null>\(null\);/, newState);

const newPreviewContent = `                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(viewingFile.url);
                      setToastMessage('Link copied to clipboard');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                  <a 
                    href={viewingFile.url} 
                    download={viewingFile.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Download</span>
                  </a>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center p-4 relative">
                {isPreviewLoading && viewingFile.type !== 'application/pdf' && !viewingFile.type?.startsWith('image/') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
                  </div>
                )}
                {isPreviewLoading && (viewingFile.type === 'application/pdf' || viewingFile.type?.startsWith('image/')) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-10 pointer-events-none">
                    <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
                  </div>
                )}
                {viewingFile.type?.startsWith('image/') ? (
                  <img onLoad={() => setIsPreviewLoading(false)} src={viewingFile.url} alt={viewingFile.name} className="max-w-full max-h-full object-contain rounded" />
                ) : viewingFile.type === 'application/pdf' ? (
                  <iframe onLoad={() => setIsPreviewLoading(false)} src={viewingFile.url} className="w-full h-full rounded border-0 bg-white" title={viewingFile.name} />
                ) : viewingFile.type?.startsWith('video/') ? (
                  <video onCanPlay={() => setIsPreviewLoading(false)} src={viewingFile.url} controls className="max-w-full max-h-full" />
                ) : viewingFile.type?.startsWith('audio/') ? (
                  <audio onCanPlay={() => setIsPreviewLoading(false)} src={viewingFile.url} controls className="w-full max-w-md" />
                ) : (
                  <div className="text-center text-neutral-400" onLoad={() => setIsPreviewLoading(false)}>
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No preview available for this file type.</p>
                    <p className="text-xs mt-2 opacity-70">{viewingFile.type}</p>
                  </div>
                )}`;

code = code.replace(/                <a [\s\S]*?<\/a>\n              <\/div>\n              <div className="flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center p-4">\n[\s\S]*?              <\/div>/, newPreviewContent);
fs.writeFileSync('src/components/MainApp.tsx', code);

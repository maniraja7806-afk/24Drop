const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf8');

const regex = /\{attachments\.length > 0 && \(\s*<div className="flex flex-wrap gap-2\.5 mb-2\.5 ml-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">\s*\{attachments\.map\(att => \(/;

const newCode = `{attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-2.5 ml-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
          {(() => {
            const isFolder = attachments.some(a => a.name.includes('/'));
            if (isFolder) {
              const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
              const totalProgress = attachments.reduce((sum, a) => sum + a.progress, 0) / attachments.length;
              const anyFailed = attachments.some(a => a.status === 'failed' || a.status === 'cancelled');
              const allSuccess = attachments.every(a => a.status === 'success');
              const status = anyFailed ? 'failed' : allSuccess ? 'success' : 'uploading';
              const firstFolderFile = attachments.find(a => a.name.includes('/'));
              const folderName = firstFolderFile ? firstFolderFile.name.split('/')[0] : 'Folder';

              return (
                <div className={clsx(
                  "relative group flex items-center space-x-3 p-3 rounded-xl border shadow-lg bg-[#212121] transition-all w-full max-w-[320px]",
                  status === 'uploading' && "border-blue-500/50 bg-blue-950/20",
                  status === 'success' && "border-emerald-500/40 bg-emerald-950/10",
                  status === 'failed' && "border-red-500/50 bg-red-950/20"
                )}>
                  <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <FolderUp className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="text-[13px] font-semibold text-white truncate">
                      {folderName}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-1">
                      <span>{attachments.length} files</span>
                      <span>•</span>
                      <span>{formatBytes(totalSize)}</span>
                    </div>
                    {status === 'uploading' && (
                      <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-200"
                          style={{ width: \`\${totalProgress}%\` }}
                        />
                      </div>
                    )}
                    {status === 'failed' && (
                      <div className="text-red-400 text-xs mt-1 font-medium">Some files failed to upload</div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      attachments.forEach(att => {
                        if (att.status === 'uploading' && att.xhr) att.xhr.abort();
                      });
                      setAttachments([]);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-red-500 transition-colors shadow-lg z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return attachments.map(att => (`;

code = code.replace(regex, newCode);
code = code.replace(/\{attachments\.length > 0 && \(\s*<div className="flex flex-wrap gap-2\.5 mb-2\.5 ml-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">\s*\{attachments\.map\(att => \(/, newCode); // double replace to be safe

code = code.replace(/\{\/\* Action Buttons \*\/\}.*?<\/div>\s*<\/div>\s*\)\)}/s, match => match + '\n          })()}');

fs.writeFileSync('src/components/Composer.tsx', code);

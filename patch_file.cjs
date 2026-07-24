const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');

const startIdx = code.indexOf('{file && (');
if (startIdx !== -1) {
  const endIdx = code.indexOf('</form>', startIdx);
  const substrToReplace = code.substring(startIdx, code.indexOf('<form', startIdx));
  
  const newAttachmentsUI = `      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 ml-2">
          {attachments.map(att => (
            <div key={att.id} className="relative inline-flex flex-col group items-center">
              <input 
                type="text" 
                value={att.name} 
                onChange={(e) => setAttachments(prev => prev.map(a => a.id === att.id ? {...a, name: e.target.value} : a))}
                className="text-[10px] bg-black/50 text-white px-1 py-0.5 rounded border border-white/10 w-20 truncate mb-1 focus:w-32 focus:absolute focus:-top-6 focus:z-20 transition-all outline-none"
                disabled={isSending}
                title="Rename file"
              />
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-[#212121] shadow-xl flex flex-col items-center justify-center">
                {att.previewUrl ? (
                  <img src={att.previewUrl} alt="preview" className={clsx("w-full h-full object-cover transition-opacity", isSending && "opacity-50")} />
                ) : (
                  <>
                    <svg className={clsx("w-6 h-6 text-neutral-400 mb-1", isSending && "opacity-50")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className={clsx("text-[9px] text-neutral-300 w-full px-1 truncate text-center", isSending && "opacity-50")}>{att.file.name}</span>
                  </>
                )}
                {isSending && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-white mb-1.5" />
                    <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-full" style={{ animation: "indeterminate-progress 1.5s infinite linear" }} />
                    </div>
                  </div>
                )}
              </div>
              {!isSending && (
                <button 
                  type="button"
                  aria-label="Remove file"
                  onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} 
                  className="absolute top-4 -right-1 w-5 h-5 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 md:opacity-0 md:group-hover:opacity-100 active:scale-90"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      `;
  code = code.substring(0, startIdx) + newAttachmentsUI + code.substring(code.indexOf('<form', startIdx));
  fs.writeFileSync('src/components/Composer.tsx', code);
} else {
  console.log("Could not find {file && (");
}

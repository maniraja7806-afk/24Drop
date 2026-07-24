const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');

const newInputs = `                    <label className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-neutral-400" />
                      <span>Upload Files</span>
                      <input type="file" multiple className="hidden" onChange={(e) => { 
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files).map(f => {
                            const isImage = f.type.startsWith('image/');
                            const previewUrl = isImage ? URL.createObjectURL(f) : null;
                            return { id: Math.random().toString(), file: f, name: f.name, previewUrl };
                          });
                          const validFiles = newFiles.filter(f => f.file.size <= 25 * 1024 * 1024 * 1024);
                          if (validFiles.length < newFiles.length) {
                            setToastMessage("Some files were skipped because they exceed 25GB.");
                          }
                          setAttachments(prev => [...prev, ...validFiles]);
                        }
                        setIsMenuOpen(false); 
                      }} />
                    </label>
                    <label className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-neutral-400" />
                      <span>Upload Folder</span>
                      <input type="file" multiple {...({ webkitdirectory: "", directory: "" } as any)} className="hidden" onChange={(e) => { 
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files).map(f => {
                            const isImage = f.type.startsWith('image/');
                            const previewUrl = isImage ? URL.createObjectURL(f) : null;
                            return { id: Math.random().toString(), file: f, name: f.name, previewUrl };
                          });
                          const validFiles = newFiles.filter(f => f.file.size <= 25 * 1024 * 1024 * 1024);
                          if (validFiles.length < newFiles.length) {
                            setToastMessage("Some files were skipped because they exceed 25GB.");
                          }
                          setAttachments(prev => [...prev, ...validFiles]);
                        }
                        setIsMenuOpen(false); 
                      }} />
                    </label>`;

code = code.replace(/                    <label className="w-full px-4 py-2\.5 hover:bg-white\/5 flex items-center space-x-3 text-\[15px\] text-neutral-200 cursor-pointer transition-colors">[\s\S]*?<\/label>/, newInputs);
fs.writeFileSync('src/components/Composer.tsx', code);

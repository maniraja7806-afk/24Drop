const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const importHelper = `import { AudioVisualizer } from './AudioVisualizer';
import { AudioPlayer } from './AudioPlayer';`;

code = code.replace("import { AudioVisualizer } from './AudioVisualizer';", importHelper);

// Patch post view
const oldPostAttachment = `{post.fileType?.startsWith('image/') ? (
                        <img src={post.fileUrl} alt="attachment" className="w-full max-h-96 object-cover cursor-pointer" onClick={() => setViewingImage(post.fileUrl)} />
                      ) : (
                        <div className="p-4 flex items-center space-x-3">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <Globe className="w-6 h-6" />
                          </div>
                          <a href={post.fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{post.fileName}</a>
                        </div>
                      )}`;

const newPostAttachment = `{post.fileType?.startsWith('image/') ? (
                        <img src={post.fileUrl} alt="attachment" className="w-full max-h-96 object-cover cursor-pointer" onClick={() => setViewingImage(post.fileUrl)} />
                      ) : post.fileType?.startsWith('audio/') ? (
                        <div className="p-4">
                          <AudioPlayer src={post.fileUrl} />
                        </div>
                      ) : (
                        <div className="p-4 flex items-center space-x-3">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <Globe className="w-6 h-6" />
                          </div>
                          <a href={post.fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{post.fileName}</a>
                        </div>
                      )}`;
code = code.replace(oldPostAttachment, newPostAttachment);


// Patch msg view
const oldMsgAttachment = `{msg.fileType?.startsWith('image/') ? (
                              <img src={msg.fileUrl} alt="attachment" className="max-w-full rounded-md cursor-pointer" onClick={() => setViewingImage(msg.fileUrl)} />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline opacity-80">{msg.fileName}</a>
                            )}`;

const newMsgAttachment = `{msg.fileType?.startsWith('image/') ? (
                              <img src={msg.fileUrl} alt="attachment" className="max-w-full rounded-md cursor-pointer" onClick={() => setViewingImage(msg.fileUrl)} />
                            ) : msg.fileType?.startsWith('audio/') ? (
                              <AudioPlayer src={msg.fileUrl} />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline opacity-80">{msg.fileName}</a>
                            )}`;

code = code.replace(oldMsgAttachment, newMsgAttachment);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched usage of AudioPlayer");

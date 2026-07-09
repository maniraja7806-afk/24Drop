const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const oldCode = `<AnimatePresence>
              {isRecordingAudio && audioStream && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, y: 10, height: 0, marginBottom: 0 }}
                  className="w-full bg-[#212121] rounded-[24px] flex flex-col items-center justify-center py-6 shadow-2xl relative overflow-hidden"
                >
                  <div className="px-3 py-1 rounded-full border border-red-500/30 text-red-500 flex items-center space-x-1.5 text-[11px] mb-4">
                    <AudioLines className="w-3 h-3" />
                    <span>Audio</span>
                  </div>
                  
                  <div className="w-full flex items-center justify-center mb-4 px-8">
                     <LargeAudioVisualizer stream={audioStream} />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2 text-white mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-sm font-medium"><RecordingTimer isRecording={isRecordingAudio} /></span>
                    </div>

                    <button 
                      onClick={handleMicClick}
                      className="w-12 h-12 bg-[#ea4335] hover:bg-[#d93025] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    >
                      <div className="w-4 h-4 bg-white rounded-sm" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>`;

const newCode = `<AnimatePresence>
              {isRecordingAudio && audioStream && (
                <div className="flex items-end space-x-3 mb-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="flex-1 bg-[#212121] rounded-[24px] flex flex-col items-center justify-center py-4 shadow-2xl relative overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-center mb-4 px-4">
                       <LargeAudioVisualizer stream={audioStream} />
                    </div>

                    <div className="flex items-center justify-between w-full px-6">
                      <div className="px-3 py-1 rounded-full border border-red-500/30 text-red-500 flex items-center space-x-1.5 text-[11px]">
                        <AudioLines className="w-3 h-3" />
                        <span>Audio</span>
                      </div>

                      <div className="flex items-center space-x-2 text-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-sm font-medium"><RecordingTimer isRecording={isRecordingAudio} /></span>
                      </div>

                      <button 
                        onClick={handleMicClick}
                        className="w-10 h-10 bg-[#ea4335] hover:bg-[#d93025] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      >
                        <div className="w-3 h-3 bg-white rounded-sm" />
                      </button>
                    </div>
                  </motion.div>
                  {/* Invisible placeholder for send button alignment */}
                  <div className="w-12 h-12 flex-shrink-0" />
                </div>
              )}
            </AnimatePresence>`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched recording style");

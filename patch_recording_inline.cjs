const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// 1. Remove the full screen overlay
const oldOverlay = `{isRecordingAudio && audioStream && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-[#121212] flex flex-col items-center justify-center"
          >
            <div className="absolute top-1/4 flex flex-col items-center">
              <div className="px-4 py-1.5 rounded-full border border-red-500/30 text-red-500 flex items-center space-x-2 text-sm">
                <AudioLines className="w-4 h-4" />
                <span>Audio</span>
              </div>
            </div>
            
            <div className="w-full flex items-center justify-center my-12">
               <LargeAudioVisualizer stream={audioStream} />
            </div>

            <div className="absolute bottom-1/4 flex flex-col items-center">
              <div className="flex items-center space-x-2 text-white mb-8">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-lg font-medium"><RecordingTimer isRecording={isRecordingAudio} /></span>
              </div>

              <button 
                onClick={handleMicClick}
                className="w-16 h-16 bg-[#ea4335] hover:bg-[#d93025] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <div className="w-5 h-5 bg-white rounded-sm" />
              </button>
            </div>
          </motion.div>
        )}`;
code = code.replace(oldOverlay, '');

// 2. Insert it before the composer
const oldComposer = `<div className="flex items-end space-x-3">
              <div className="flex-1 flex items-end bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl relative">`;

const newComposer = `<AnimatePresence>
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
            </AnimatePresence>
            
            <div className="flex items-end space-x-3">
              <div className="flex-1 flex items-end bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl relative">`;

code = code.replace(oldComposer, newComposer);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched inline recording UI");

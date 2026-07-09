const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import { AudioVisualizer } from './AudioVisualizer';",
  "import { AudioVisualizer } from './AudioVisualizer';\nimport { LargeAudioVisualizer } from './LargeAudioVisualizer';\nimport { RecordingTimer } from './RecordingTimer';"
);

code = code.replace(
  "import { Play, Pause } from 'lucide-react';",
  "import { Play, Pause, Square } from 'lucide-react';"
);
if (!code.includes("import { Square }")) {
   code = code.replace(
     "Trash2, Plus, Mic, AudioLines, Sparkles, Telescope, Cpu, Paperclip, Check, CheckCheck, Copy, Loader2, Triangle, Upload, Camera } from 'lucide-react';",
     "Trash2, Plus, Mic, AudioLines, Sparkles, Telescope, Cpu, Paperclip, Check, CheckCheck, Copy, Loader2, Triangle, Upload, Camera, Square } from 'lucide-react';"
   );
}

// 2. Change the button to just a mic when not recording, and remove the small visualizer 
const oldMicButton = `                    {isRecordingAudio && audioStream ? (
                      <AudioVisualizer stream={audioStream} />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}`;
const newMicButton = `                    <Mic className="w-5 h-5" />`;
code = code.replace(oldMicButton, newMicButton);

const oldMicButtonClass = `                      isRecordingAudio ? "text-red-500 bg-red-500/10" : "text-neutral-400 hover:text-white"`;
const newMicButtonClass = `                      "text-neutral-400 hover:text-white"`;
code = code.replace(oldMicButtonClass, newMicButtonClass);

// 3. Add the AnimatePresence overlay
const overlayCode = `        {isCameraOpen && (`;
const newOverlayCode = `        {isRecordingAudio && audioStream && (
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
        )}

        {isCameraOpen && (`;
        
code = code.replace(overlayCode, newOverlayCode);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched recording UI");

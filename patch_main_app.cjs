const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import { LargeAudioVisualizer } from './LargeAudioVisualizer';",
  "import { LargeAudioVisualizer } from './LargeAudioVisualizer';\nimport { AudioTrimmer } from './AudioTrimmer';"
);

// 2. Add states
code = code.replace(
  "const [isRecordingAudio, setIsRecordingAudio] = useState(false);",
  "const [isRecordingAudio, setIsRecordingAudio] = useState(false);\n  const [isAudioPaused, setIsAudioPaused] = useState(false);\n  const [audioDraft, setAudioDraft] = useState<Blob | null>(null);\n  const [toastMessage, setToastMessage] = useState<string | null>(null);"
);

// 3. Modify handleDiscardAudio to reset pause state
code = code.replace(
  "setIsRecordingAudio(false);",
  "setIsRecordingAudio(false);\n      setIsAudioPaused(false);"
);

// 4. Add handlePauseResumeAudio and modify handleMicClick -> handleStopRecording
const pauseResumeCode = `
  const handlePauseResumeAudio = () => {
    if (isRecordingAudio && mediaRecorderRef.current) {
      if (isAudioPaused) {
        mediaRecorderRef.current.resume();
        setIsAudioPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsAudioPaused(true);
      }
    }
  };
`;

code = code.replace(
  "const handleMicClick = async () => {",
  pauseResumeCode + "\n  const handleMicClick = async () => {"
);

// 5. Update mediaRecorder.onstop
const oldOnStop = `        mediaRecorder.onstop = () => {
          if (isDiscardingAudioRef.current) {
            isDiscardingAudioRef.current = false;
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], "voice_message.webm", { type: 'audio/webm' });
          setFile(audioFile);
          stream.getTracks().forEach(track => track.stop());
        };`;
        
const newOnStop = `        mediaRecorder.onstop = () => {
          if (isDiscardingAudioRef.current) {
            isDiscardingAudioRef.current = false;
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioDraft(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };`;
        
code = code.replace(oldOnStop, newOnStop);

// 6. Update stop in handleMicClick
code = code.replace(
  `    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      setAudioStream(null);
    } else {`,
  `    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      setIsAudioPaused(false);
      setAudioStream(null);
    } else {`
);

// 7. Update UI to include Pause/Resume button and use handleMicClick to stop.
const oldUi = `                      <button 
                        onClick={handleDiscardAudio}
                        className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center space-x-2 text-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-sm font-medium"><RecordingTimer isRecording={isRecordingAudio} /></span>
                      </div>

                      <button 
                        onClick={handleMicClick}
                        className="w-10 h-10 bg-[#ea4335] hover:bg-[#d93025] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      >
                        <div className="w-3 h-3 bg-white rounded-sm" />
                      </button>`;
                      
const newUi = `                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={handleDiscardAudio}
                          className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={handlePauseResumeAudio}
                          className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
                        >
                          {isAudioPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-white">
                        {!isAudioPaused && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        {isAudioPaused && <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />}
                        <span className="font-mono text-sm font-medium"><RecordingTimer isRecording={isRecordingAudio} isPaused={isAudioPaused} /></span>
                      </div>

                      <button 
                        onClick={handleMicClick}
                        className="w-10 h-10 bg-[#ea4335] hover:bg-[#d93025] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </button>`;

code = code.replace(oldUi, newUi);

// 8. In the composer area, render AudioTrimmer if audioDraft exists
const composerStart = `<div className="flex items-end space-x-3 mb-2">`;
const composerReplacement = `
                {audioDraft ? (
                  <div className="flex items-end space-x-3 mb-2">
                    <AudioTrimmer 
                      blob={audioDraft} 
                      onCancel={() => setAudioDraft(null)} 
                      onConfirm={(trimmedBlob) => {
                        const audioFile = new File([trimmedBlob], "voice_message.wav", { type: 'audio/wav' });
                        setFile(audioFile);
                        setAudioDraft(null);
                        setToastMessage("Recording finalized and ready to send");
                        setTimeout(() => setToastMessage(null), 3000);
                      }} 
                    />
                    <div className="w-12 h-12 flex-shrink-0" />
                  </div>
                ) : (
                <div className="flex items-end space-x-3 mb-2">
`;
code = code.replace(composerStart, composerReplacement);

// 9. Close the ternary
const composerEnd = `{/* Invisible placeholder for send button alignment */}
                  <div className="w-12 h-12 flex-shrink-0" />
                </div>
              )}`;
const composerEndReplacement = `{/* Invisible placeholder for send button alignment */}
                  <div className="w-12 h-12 flex-shrink-0" />
                </div>
                )}
              )}`;
code = code.replace(composerEnd, composerEndReplacement);

// 10. Add Toast Notification
const toastCode = `
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-neutral-800 border border-white/10 text-white px-4 py-2 rounded-full shadow-2xl flex items-center space-x-2 text-sm"
          >
            <Check className="w-4 h-4 text-green-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
`;
code = code.replace("return (", "return (\n    <>\n" + toastCode);
code = code.replace("    </div>\n    </>", "    </div>\n    </>\n    </>"); // fixing root fragment

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched main app for trimmer, pause/resume, and toast");

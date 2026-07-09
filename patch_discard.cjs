const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// Add discard ref
code = code.replace(
  "const [isRecordingAudio, setIsRecordingAudio] = useState(false);",
  "const [isRecordingAudio, setIsRecordingAudio] = useState(false);\n  const isDiscardingAudioRef = useRef(false);"
);

// modify onstop
code = code.replace(
  "        mediaRecorder.onstop = () => {",
  "        mediaRecorder.onstop = () => {\n          if (isDiscardingAudioRef.current) {\n            isDiscardingAudioRef.current = false;\n            stream.getTracks().forEach(track => track.stop());\n            return;\n          }"
);

// add handleDiscardAudio function
const discardFunc = `
  const handleDiscardAudio = () => {
    if (isRecordingAudio) {
      isDiscardingAudioRef.current = true;
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      setAudioStream(null);
    }
  };
`;
code = code.replace(
  "  const handleMicClick = async () => {",
  discardFunc + "\n  const handleMicClick = async () => {"
);

// modify UI to add delete button
// Search for: <div className="flex items-center space-x-2 text-white">
// And we want to put it to the left of the flex center container or somewhere

const oldUi = `                      <div className="px-3 py-1 rounded-full border border-red-500/30 text-red-500 flex items-center space-x-1.5 text-[11px]">
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
                    </div>`;

const newUi = `                      <button 
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
                      </button>
                    </div>`;

code = code.replace(oldUi, newUi);
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched discard");

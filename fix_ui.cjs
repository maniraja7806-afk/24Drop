const fs = require('fs');
const lines = fs.readFileSync('src/components/MainApp.tsx', 'utf8').split('\n');
const top = lines.slice(0, 841).join('\n');
const bottom = lines.slice(909).join('\n');

const newBlock = `            <AnimatePresence>
              {audioDraft && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="flex items-end space-x-3 mb-2"
                  >
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
                  </motion.div>
              )}
              {isRecordingAudio && audioStream && (
                <div className="flex items-end space-x-3 mb-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="flex-1 bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-center mb-4 px-4">
                       <LargeAudioVisualizer stream={audioStream} />
                    </div>

                    <div className="flex items-center justify-between w-full px-6">
                      <div className="flex items-center space-x-3">
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
                      </button>
                    </div>
                  </motion.div>
                  {/* Invisible placeholder for send button alignment */}
                  <div className="w-12 h-12 flex-shrink-0" />
                </div>
              )}
            </AnimatePresence>`;

fs.writeFileSync('src/components/MainApp.tsx', top + '\n' + newBlock + '\n' + bottom);

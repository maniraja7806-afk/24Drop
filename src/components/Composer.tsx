import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { Send, Plus, Mic, AudioLines, Loader2, Camera, Upload, X } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { socket } from '../lib/socket';
import { getAccessToken, googleSignIn } from '../lib/auth';
import { openPicker } from '../lib/picker';
import clsx from 'clsx';

interface ComposerProps {
  view: 'chat' | 'feed';
  activeChat: string | null;
  parentId?: string | null;
  session: any;
  file: File | null;
  setFile: (file: File | null) => void;
  openCustomCamera: () => void;
  handleMicClick: () => void;
  setToastMessage: (msg: string | null) => void;
}

export const Composer = memo(({
  view,
  activeChat,
  parentId,
  session,
  file,
  setFile,
  openCustomCamera,
  handleMicClick,
  setToastMessage
}: ComposerProps) => {
  const [composerText, setComposerText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [driveFile, setDriveFile] = useState<{name: string, url: string, type: string} | null>(null);
  const [attachments, setAttachments] = useState<{id: string, file: File, name: string, previewUrl: string | null}[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (file) {
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      setAttachments(prev => [...prev, { id: Math.random().toString(), file, name: file.name, previewUrl }]);
      setFile(null);
    }
  }, [file, setFile]);

  useEffect(() => {
    // Cleanup preview URLs
    return () => {
      attachments.forEach(att => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, [attachments]);

  const handleDriveClick = async () => {
    setIsMenuOpen(false);
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) token = result.accessToken;
      }
      if (token) {
        openPicker(token, (pickedFile: any) => {
          setDriveFile({
            name: pickedFile.name,
            url: pickedFile.url || pickedFile.embedUrl || '',
            type: pickedFile.mimeType
          });
          setFile(null);
        });
      }
    } catch (err) {
      console.error("Drive error:", err);
      setToastMessage("Failed to connect to Google Drive.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSend = async () => {
    if (!composerText.trim() && attachments.length === 0 && !driveFile) return;
    setIsSending(true);
    
    try {
      const sendRequest = async (formData: FormData) => {
        if (view === 'feed') {
          await fetchApi('/api/posts', { method: 'POST', body: formData });
        } else if (view === 'chat' && activeChat) {
          await fetchApi(`/api/messages/${activeChat}`, { method: 'POST', body: formData });
        }
      };
      
      const promises = [];
      let textSent = false;
      
      // If 1 attachment and no drive file, send together
      if (attachments.length === 1 && !driveFile) {
        const formData = new FormData();
        if (composerText.trim()) formData.append('content', composerText);
        if (parentId) formData.append('parentId', parentId);
        formData.append('file', attachments[0].file, attachments[0].name);
        promises.push(sendRequest(formData));
        textSent = true;
      } 
      // If 0 attachments and 1 drive file, send together
      else if (attachments.length === 0 && driveFile) {
        const formData = new FormData();
        if (composerText.trim()) formData.append('content', composerText);
        if (parentId) formData.append('parentId', parentId);
        formData.append('driveFileUrl', driveFile.url);
        formData.append('driveFileName', driveFile.name);
        formData.append('driveFileType', driveFile.type);
        promises.push(sendRequest(formData));
        textSent = true;
      }
      
      // If text hasn't been sent, send it as a separate message
      if (!textSent && composerText.trim()) {
        const formData = new FormData();
        formData.append('content', composerText);
        if (parentId) formData.append('parentId', parentId);
        promises.push(sendRequest(formData));
      }
      
      // Send remaining attachments if not already sent
      if (attachments.length > 1 || (attachments.length === 1 && driveFile)) {
        for (const attachment of attachments) {
          const formData = new FormData();
          if (parentId) formData.append('parentId', parentId);
          formData.append('file', attachment.file, attachment.name);
          promises.push(sendRequest(formData));
        }
      }
      
      // Send drive file if not already sent
      if (driveFile && attachments.length > 0) {
        const formData = new FormData();
        if (parentId) formData.append('parentId', parentId);
        formData.append('driveFileUrl', driveFile.url);
        formData.append('driveFileName', driveFile.name);
        formData.append('driveFileType', driveFile.type);
        promises.push(sendRequest(formData));
      }

      await Promise.all(promises);

      setComposerText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setAttachments([]);
      setDriveFile(null);
      if (view === 'chat' && activeChat && isTyping) {
        setIsTyping(false);
        socket.emit('stop_typing', { from: session.username, to: activeChat });
        clearTimeout((window as any).typingTimeout);
      }
    } catch (e: any) {
      console.error(e);
      setToastMessage(e.message || "Failed to send message. Please try again.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerText(e.target.value);
    
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
    
    if (view === 'chat' && activeChat) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { from: session.username, to: activeChat,
  parentId, avatar: session.avatar, color: session.color });
      }
      
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop_typing', { from: session.username, to: activeChat });
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col">
      {driveFile && (
        <div className="mb-2 relative inline-flex self-start group items-end ml-2">
          <div className="flex items-center space-x-3 bg-[#212121] border border-white/10 rounded-xl p-3 shadow-xl pr-10">
            <svg viewBox="0 0 48 48" className="w-8 h-8 flex-shrink-0">
              <path fill="#FFC107" d="M17 5.865L26.794 22.8h19.141L36.141 5.865z"/>
              <path fill="#1976D2" d="M11.666 14.914L2 31.66h19.245l9.666-16.746z"/>
              <path fill="#4CAF50" d="M36.14 43.135L26.347 26.2H7.206L17.065 43.135z"/>
            </svg>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate max-w-[200px]">{driveFile.name}</span>
              <span className="text-xs text-neutral-400">Google Drive</span>
            </div>
          </div>
          {!isSending && (
            <button 
              type="button"
              aria-label="Remove Drive file"
              onClick={() => setDriveFile(null)} 
              className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
            {attachments.length > 0 && (
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
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end space-x-3">
        <div className="flex-1 flex items-end bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl relative">
          
          <div className="flex items-center pl-1 pr-2 pb-1.5 flex-shrink-0 self-end">
            <div className="relative">
              {isMenuOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-48 max-w-[90vw] bg-[#2f2f2f] rounded-[16px] overflow-hidden shadow-2xl z-50">
                  <div className="py-2 flex flex-col">
                    <button type="button" onClick={handleDriveClick} className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors">
                      <svg viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#FFC107" d="M17 5.865L26.794 22.8h19.141L36.141 5.865z"/>
                        <path fill="#1976D2" d="M11.666 14.914L2 31.66h19.245l9.666-16.746z"/>
                        <path fill="#4CAF50" d="M36.14 43.135L26.347 26.2H7.206L17.065 43.135z"/>
                      </svg>
                      <span>Drive</span>
                    </button>
                    <label className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-neutral-400" />
                      <span>Upload Files</span>
                      <input type="file" multiple className="hidden" onChange={(e) => { 
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files as any).map((f: any) => {
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
                          const newFiles = Array.from(e.target.files as any).map((f: any) => {
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
                    <button type="button" onClick={() => { setIsMenuOpen(false); openCustomCamera(); }} className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors">
                      <Camera className="w-4 h-4 text-neutral-400" />
                      <span>Camera</span>
                    </button>
                  </div>
                </div>
              )}
              <button 
                type="button"
                aria-label="Add files"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={clsx("w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors", isMenuOpen && "bg-white/10 text-white")}
              >
                <Plus className={clsx("w-5 h-5 transition-transform", isMenuOpen && "rotate-45")} />
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Send Message..."
            value={composerText}
            onChange={handleComposerChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] px-1 py-2 placeholder-neutral-400 outline-none text-white resize-none min-h-[40px] max-h-32 self-center"
            disabled={isSending}
          />

          <div className="flex items-center space-x-1 pr-1 pb-1.5 flex-shrink-0 self-end">
            <button 
              type="button"
              aria-label="Microphone"
              onClick={handleMicClick}
              className={clsx(
                "p-1.5 transition-colors cursor-pointer rounded-full overflow-hidden flex items-center justify-center",
                "text-neutral-400 hover:text-white"
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          type="submit"
          aria-label="Send"
          disabled={isSending || (!composerText.trim() && attachments.length === 0 && !driveFile)}
          className="w-12 h-12 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0 flex items-center justify-center shadow-lg"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : composerText.trim() || attachments.length > 0 || driveFile ? (
            <Send className="w-5 h-5 ml-0.5" />
          ) : (
            <AudioLines className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
});

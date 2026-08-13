import React, { useState, useRef, useEffect, useLayoutEffect, memo } from 'react';
import { 
  Send, Plus, Mic, AudioLines, Loader2, Camera, Upload, X, 
  RefreshCw, FileText, FileArchive, FileCode, Video, Music, 
  File, CheckCircle2, AlertCircle, Trash2, FolderUp, Reply
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { socket } from '../lib/socket';
import { getAccessToken, googleSignIn } from '../lib/auth';
import { openPicker } from '../lib/picker';
import { formatBytes, getFileCategory } from '../lib/format';
import clsx from 'clsx';

export interface DraftAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string | null;
  status: 'uploading' | 'success' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  fileUrl?: string;
  draftFileId?: string;
  error?: string;
  file?: File;
  xhr?: XMLHttpRequest;
}

interface ComposerProps {
  view: 'chat' | 'feed';
  activeChat: string | null;
  parentId?: string | null;
  replyToMessage?: any | null;
  setReplyToMessage?: (msg: any | null) => void;
  session: any;
  file: File | null;
  setFile: (file: File | null) => void;
  openCustomCamera: () => void;
  handleMicClick: () => void;
  setToastMessage: (msg: string | null) => void;
  onMessageSent?: () => void;
}

export const Composer = memo(({
  view,
  activeChat,
  parentId,
  replyToMessage,
  setReplyToMessage,
  session,
  file,
  setFile,
  openCustomCamera,
  handleMicClick,
  setToastMessage,
  onMessageSent
}: ComposerProps) => {
  const [composerText, setComposerText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [driveFile, setDriveFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [messageSent, setMessageSent] = useState(false);

  const storageKey = `documind_draft_att_${view}_${activeChat || 'global'}`;
  const textStorageKey = `documind_draft_text_${view}_${activeChat || 'global'}`;

  // Restore draft state on mount or activeChat change
  useEffect(() => {
    const savedText = localStorage.getItem(textStorageKey);
    if (savedText) {
      setComposerText(savedText);
    } else {
      setComposerText('');
    }

    const savedAtt = localStorage.getItem(storageKey);
    if (savedAtt) {
      try {
        const parsed: DraftAttachment[] = JSON.parse(savedAtt);
        const restored = parsed.map(att => {
          if (att.status === 'uploading') {
            return {
              ...att,
              status: 'failed' as const,
              error: 'Upload interrupted during page refresh. Click retry.'
            };
          }
          return att;
        });
        setAttachments(restored);
      } catch (e) {
        setAttachments([]);
      }
    } else {
      setAttachments([]);
    }
  }, [view, activeChat, storageKey, textStorageKey]);

  // Focus textarea when replyToMessage is selected
  useEffect(() => {
    if (replyToMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyToMessage]);

  // Persist text changes
  useEffect(() => {
    localStorage.setItem(textStorageKey, composerText);
  }, [composerText, textStorageKey]);

  // Persist attachment metadata changes
  useEffect(() => {
    const serializable = attachments.map(({ xhr, file, ...rest }) => rest);
    localStorage.setItem(storageKey, JSON.stringify(serializable));
  }, [attachments, storageKey]);

  // Background XHR upload function
  const uploadDraftFile = (draftId: string, fileObj: File) => {
    const sessionId = localStorage.getItem('sessionId');
    const formData = new FormData();
    formData.append('file', fileObj, fileObj.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/draft');
    if (sessionId) {
      xhr.setRequestHeader('x-session-id', sessionId);
    }

    setAttachments(prev => prev.map(a => a.id === draftId ? { ...a, xhr, status: 'uploading', progress: 0 } : a));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setAttachments(prev => prev.map(a => a.id === draftId ? { ...a, progress: percent } : a));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setAttachments(prev => prev.map(a => a.id === draftId ? {
              ...a,
              status: 'success',
              progress: 100,
              fileUrl: res.fileUrl,
              draftFileId: res.draftFileId,
              size: res.fileSize || a.size,
              type: res.fileType || a.type,
              xhr: undefined
            } : a));
            return;
          }
        } catch (e) {}
      }
      let errorMsg = 'Upload failed';
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.error) errorMsg = res.error;
      } catch (e) {}
      setAttachments(prev => prev.map(a => a.id === draftId ? {
        ...a,
        status: 'failed',
        error: errorMsg,
        xhr: undefined
      } : a));
    };

    xhr.onerror = () => {
      setAttachments(prev => prev.map(a => a.id === draftId ? {
        ...a,
        status: 'failed',
        error: 'Network connection error',
        xhr: undefined
      } : a));
    };

    xhr.onabort = () => {
      setAttachments(prev => prev.map(a => a.id === draftId ? {
        ...a,
        status: 'cancelled',
        error: 'Upload cancelled',
        xhr: undefined
      } : a));
    };

    xhr.send(formData);
  };

  const handleAddFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const validFiles = fileArray.filter(f => f.size <= 5 * 1024 * 1024 * 1024); // 5GB limit
    if (validFiles.length < fileArray.length) {
      setToastMessage("Some files were skipped because they exceed 5GB limit.");
      setTimeout(() => setToastMessage(null), 3000);
    }

    const newDraftItems: DraftAttachment[] = validFiles.map(f => {
      const id = Math.random().toString(36).substring(2) + Date.now();
      const isMedia = f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/');
      const previewUrl = isMedia ? URL.createObjectURL(f) : null;
      return {
        id,
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        previewUrl,
        status: 'uploading',
        progress: 0,
        file: f
      };
    });

    setAttachments(prev => [...prev, ...newDraftItems]);

    // Start background upload immediately
    newDraftItems.forEach(item => {
      if (item.file) {
        uploadDraftFile(item.id, item.file);
      }
    });
  };

  // Handle incoming file prop from parent
  useEffect(() => {
    if (file) {
      handleAddFiles([file]);
      setFile(null);
    }
  }, [file, setFile]);

  // Cancel upload
  const handleCancelUpload = (id: string) => {
    setAttachments(prev => {
      const item = prev.find(a => a.id === id);
      if (item && item.xhr) {
        item.xhr.abort();
      }
      return prev.map(a => a.id === id ? { ...a, status: 'cancelled', xhr: undefined } : a);
    });
  };

  // Retry upload
  const handleRetryUpload = (id: string) => {
    const item = attachments.find(a => a.id === id);
    if (item && item.file) {
      uploadDraftFile(id, item.file);
    } else {
      setToastMessage("Original file is no longer in memory. Please re-select the file.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const item = prev.find(a => a.id === id);
      if (item && item.xhr) {
        item.xhr.abort();
      }
      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
  };

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

  useLayoutEffect(() => {
    if (messageSent) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        setMessageSent(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [messageSent]);

  const handleSend = async () => {
    const uploadingCount = attachments.filter(a => a.status === 'uploading').length;
    if (uploadingCount > 0) {
      setToastMessage(`Please wait for ${uploadingCount} draft file upload(s) to finish.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const failedCount = attachments.filter(a => a.status === 'failed' || a.status === 'cancelled').length;
    if (failedCount > 0) {
      setToastMessage("Please retry or remove failed/cancelled draft files before sending.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!composerText.trim() && attachments.length === 0 && !driveFile) return;

    setIsSending(true);
    const effectiveParentId = parentId || (replyToMessage ? replyToMessage.id : undefined);
    
    try {
      const sendRequest = async (payload: any) => {
        if (view === 'feed') {
          await fetchApi('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else if (view === 'chat' && activeChat) {
          await fetchApi(`/api/messages/${activeChat}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      };

      // 1 attachment and no drive file -> send together in 1 payload
      if (attachments.length === 1 && !driveFile) {
        const att = attachments[0];
        await sendRequest({
          content: composerText.trim() || undefined,
          parentId: effectiveParentId,
          fileUrl: att.fileUrl,
          fileName: att.name,
          fileType: att.type,
          fileSize: att.size
        });
      } 
      // 0 attachments and 1 drive file
      else if (attachments.length === 0 && driveFile) {
        await sendRequest({
          content: composerText.trim() || undefined,
          parentId: effectiveParentId,
          driveFileUrl: driveFile.url,
          driveFileName: driveFile.name,
          driveFileType: driveFile.type
        });
      } 
      // Multiple draft attachments
      else {
        if (composerText.trim()) {
          await sendRequest({ content: composerText.trim(), parentId: effectiveParentId });
        }
        for (const att of attachments) {
          await sendRequest({
            parentId: effectiveParentId,
            fileUrl: att.fileUrl,
            fileName: att.name,
            fileType: att.type,
            fileSize: att.size
          });
        }
        if (driveFile) {
          await sendRequest({
            parentId: effectiveParentId,
            driveFileUrl: driveFile.url,
            driveFileName: driveFile.name,
            driveFileType: driveFile.type
          });
        }
      }

      setComposerText('');
      setAttachments([]);
      setDriveFile(null);
      if (setReplyToMessage) setReplyToMessage(null);
      localStorage.removeItem(textStorageKey);
      localStorage.removeItem(storageKey);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setMessageSent(true);

      if (view === 'chat' && activeChat && isTyping) {
        setIsTyping(false);
        socket.emit('stop_typing', { from: session.username, to: activeChat });
        clearTimeout((window as any).typingTimeout);
      }

      if (onMessageSent) {
        onMessageSent();
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
        socket.emit('typing', {
          from: session.username,
          to: activeChat,
          parentId,
          avatar: session.avatar,
          color: session.color
        });
      }
      
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop_typing', { from: session.username, to: activeChat });
      }, 2000);
    }
  };

  const renderFileIcon = (type: string, name: string) => {
    const category = getFileCategory(type, name);
    switch (category) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-400" />;
      case 'pdf':
      case 'doc':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-emerald-400" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-amber-400" />;
      default:
        return <File className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div 
      className={clsx(
        "flex flex-col transition-all rounded-2xl p-1",
        isDragOver && "border-2 border-dashed border-blue-500 bg-blue-500/10"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
      }}
    >
      {/* Reply Preview Banner */}
      {replyToMessage && (
        <div className="mb-2 relative flex items-center justify-between bg-[#212121] border-l-4 border-blue-500 rounded-r-xl p-2.5 shadow-lg border border-white/10 text-xs text-neutral-300 backdrop-blur-md transition-all">
          <div className="flex items-center space-x-2 overflow-hidden mr-2">
            <Reply className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex flex-col truncate">
              <span className="font-semibold text-blue-400 truncate text-[11px]">
                Replying to @{replyToMessage.senderUsername}
              </span>
              <span className="text-neutral-400 truncate text-[12px]">
                {replyToMessage.content || replyToMessage.fileName || (replyToMessage.fileUrl ? 'Media attachment' : 'Message')}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={() => setReplyToMessage && setReplyToMessage(null)}
            className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors flex-shrink-0"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drive File Preview */}
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
              className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Draft Attachments List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-2.5 ml-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
          {attachments.map(att => (
            <div 
              key={att.id} 
              className={clsx(
                "relative group flex items-center space-x-3 p-2.5 rounded-xl border shadow-lg bg-[#212121] transition-all max-w-[260px] min-w-[220px]",
                att.status === 'uploading' && "border-blue-500/50 bg-blue-950/20",
                att.status === 'success' && "border-emerald-500/40 bg-emerald-950/10",
                (att.status === 'failed' || att.status === 'cancelled') && "border-red-500/50 bg-red-950/20"
              )}
            >
              {/* Media Thumbnail or Icon */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 flex items-center justify-center border border-white/10">
                {att.previewUrl && (att.type.startsWith('image/') || att.type.startsWith('video/')) ? (
                  att.type.startsWith('image/') ? (
                    <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={att.previewUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  renderFileIcon(att.type, att.name)
                )}

                {att.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Information & Progress */}
              <div className="flex-1 min-w-0 pr-6">
                <input 
                  type="text"
                  value={att.name}
                  onChange={(e) => setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, name: e.target.value } : a))}
                  className="text-xs font-semibold text-white bg-transparent outline-none w-full truncate border-b border-transparent focus:border-blue-500 focus:bg-black/30 px-1 py-0.5 rounded transition-all"
                  title="Click to edit name"
                  disabled={isSending}
                />
                
                <div className="flex items-center space-x-2 text-[10px] text-neutral-400 mt-0.5">
                  <span>{formatBytes(att.size)}</span>
                  <span>•</span>
                  {att.status === 'uploading' && (
                    <span className="text-blue-400 font-medium">{att.progress}%</span>
                  )}
                  {att.status === 'success' && (
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 inline" />
                      <span>Uploaded</span>
                    </span>
                  )}
                  {att.status === 'failed' && (
                    <span className="text-red-400 font-medium truncate flex items-center space-x-1" title={att.error}>
                      <AlertCircle className="w-3 h-3 inline flex-shrink-0" />
                      <span className="truncate">{att.error || 'Failed'}</span>
                    </span>
                  )}
                  {att.status === 'cancelled' && (
                    <span className="text-amber-400 font-medium">Cancelled</span>
                  )}
                </div>

                {/* Progress Bar */}
                {att.status === 'uploading' && (
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-200"
                      style={{ width: `${att.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                {att.status === 'uploading' && (
                  <button 
                    type="button"
                    aria-label="Cancel upload"
                    onClick={() => handleCancelUpload(att.id)}
                    className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-white/10 rounded-full transition-colors"
                    title="Cancel upload"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {(att.status === 'failed' || att.status === 'cancelled') && (
                  <button 
                    type="button"
                    aria-label="Retry upload"
                    onClick={() => handleRetryUpload(att.id)}
                    className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-white/10 rounded-full transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button 
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                  title="Remove draft"
                  disabled={isSending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end space-x-3">
        <div className="flex-1 flex items-end bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl relative border border-white/5">
          
          <div className="flex items-center pl-1 pr-2 pb-1.5 flex-shrink-0 self-end">
            <div className="relative">
              {isMenuOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-52 max-w-[90vw] bg-[#2f2f2f] rounded-[16px] overflow-hidden shadow-2xl z-50 border border-white/10">
                  <div className="py-2 flex flex-col">
                    <button 
                      type="button" 
                      onClick={handleDriveClick} 
                      className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors"
                    >
                      <svg viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#FFC107" d="M17 5.865L26.794 22.8h19.141L36.141 5.865z"/>
                        <path fill="#1976D2" d="M11.666 14.914L2 31.66h19.245l9.666-16.746z"/>
                        <path fill="#4CAF50" d="M36.14 43.135L26.347 26.2H7.206L17.065 43.135z"/>
                      </svg>
                      <span>Google Drive</span>
                    </button>

                    <button 
    type="button" 
    onClick={() => { setIsMenuOpen(false); setTimeout(() => fileInputRef.current?.click(), 0); }}
    className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors"
  >
    <Upload className="w-4 h-4 text-neutral-400" />
    <span>Upload Files</span>
  </button>

                    <button 
    type="button" 
    onClick={() => { setIsMenuOpen(false); setTimeout(() => folderInputRef.current?.click(), 0); }}
    className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors"
  >
    <FolderUp className="w-4 h-4 text-neutral-400" />
    <span>Upload Folder</span>
  </button>

                    <button 
                      type="button" 
                      onClick={() => { setIsMenuOpen(false); openCustomCamera(); }} 
                      className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors"
                    >
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
                className={clsx(
                  "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors",
                  isMenuOpen && "bg-white/10 text-white"
                )}
              >
                <Plus className={clsx("w-5 h-5 transition-transform", isMenuOpen && "rotate-45")} />
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Send a message..."
            value={composerText}
            onChange={handleComposerChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-sm sm:text-[15px] px-1.5 py-2.5 placeholder-neutral-400 outline-none text-white resize-none min-h-[40px] max-h-32 self-center leading-normal placeholder:truncate placeholder:select-none"
            disabled={isSending}
          />

          <div className="flex items-center space-x-1 pr-1 pb-1.5 flex-shrink-0 self-end">
            <button 
              type="button"
              aria-label="Microphone"
              onClick={handleMicClick}
              className="p-2 md:p-1.5 transition-colors cursor-pointer rounded-full overflow-hidden flex items-center justify-center text-neutral-400 hover:text-white"
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
      <input 
        type="file" 
        multiple 
        ref={fileInputRef}
        className="hidden" 
        onChange={(e) => { 
          if (e.target.files) handleAddFiles(e.target.files);
          if (e.target) e.target.value = '';
        }} 
      />
      <input 
        type="file" 
        multiple 
        ref={folderInputRef}
        {...({ webkitdirectory: "", directory: "" } as any)} 
        className="hidden" 
        onChange={(e) => { 
          if (e.target.files) handleAddFiles(e.target.files);
          if (e.target) e.target.value = '';
        }} 
      />
    </div>
  );
});

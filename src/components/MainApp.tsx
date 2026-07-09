import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, LogOut, Send, Image as ImageIcon, X, Trash2, Plus, Mic, AudioLines, Sparkles, Telescope, Cpu, Paperclip, Check, CheckCheck, Copy, Loader2, Triangle, Upload, Camera, Square, Play, Pause } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { socket } from '../lib/socket';
import { Countdown } from './Countdown';
import clsx from 'clsx';
import { initAuth, googleSignIn, getAccessToken } from '../lib/auth';
import { loadPickerApi, openPicker } from '../lib/picker';
import { AudioVisualizer } from './AudioVisualizer';
import { LargeAudioVisualizer } from './LargeAudioVisualizer';
import { AudioTrimmer } from './AudioTrimmer';
import { RecordingTimer } from './RecordingTimer';
import { AudioPlayer } from './AudioPlayer';
import { DissolvingItem } from './DissolvingItem';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(\${query.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-500/40 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};
export function MainApp({ session, onLogout }: { session: any; onLogout: () => void }) {
  const [view, setView] = useState<'feed' | 'chat'>('feed');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [composerText, setComposerText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const filePreviewUrl = useMemo(() => {
    if (file && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{username: string, avatar: string, color: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [audioDraft, setAudioDraft] = useState<Blob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isDiscardingAudioRef = useRef(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);
  const [quickEmojis, setQuickEmojis] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickEmojis');
    return saved ? JSON.parse(saved) : ['👍', '❤️', '😂', '😮', '😢', '🔥'];
  });
  const [isCustomizingEmojis, setIsCustomizingEmojis] = useState(false);

  const [activeReactionMsgFull, setActiveReactionMsgFull] = useState<string | null>(null);
  const [activeMenuMsg, setActiveMenuMsg] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);



    useEffect(() => {
    const handleEmojiClick = (e: any) => {
      const emoji = e.detail;
      if (isCustomizing) {
        setQuickEmojis(prev => {
          let newEmojis;
          if (prev.length < 6) {
            newEmojis = [...prev, emoji];
          } else {
            newEmojis = [...prev.slice(1), emoji];
          }
          localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
          return newEmojis;
        });
      } else {
        if (activeReactionMsgFull) {
          toggleReaction(activeReactionMsgFull, emoji);
          setActiveReactionMsgFull(null);
        }
      }
    };
    window.addEventListener('emoji_picker_click', handleEmojiClick);
    return () => window.removeEventListener('emoji_picker_click', handleEmojiClick);
  }, [isCustomizing, activeReactionMsgFull]);

  useEffect(() => {
    initAuth();
    loadPickerApi(() => console.log('Picker loaded'));
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const handleDriveClick = async () => {
    setIsMenuOpen(false);
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) token = result.accessToken;
      }
      if (token) {
        openPicker(token, (pickedFile) => {
          const fakeFile = new File([""], pickedFile.name, { type: pickedFile.mimeType });
          setFile(fakeFile);
        });
      }
    } catch (err) {
      console.error("Drive error:", err);
      alert("Failed to connect to Google Drive.");
    }
  };

  const openCustomCamera = async () => {
    setIsMenuOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission') || err?.message?.includes('denied')) {
        alert("Camera access was denied. Please allow camera access to capture photos.");
      } else {
        alert("Could not access camera. Please check your device permissions.");
      }
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "camera_capture.jpg", { type: 'image/jpeg' });
            setFile(capturedFile);
            closeCamera();
          }
        }, 'image/jpeg');
      }
    }
  };


  const handleDiscardAudio = () => {
    if (isRecordingAudio) {
      isDiscardingAudioRef.current = true;
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      setIsAudioPaused(false);
      setAudioStream(null);
    }
  };

  
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

  const handleMicClick = async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      setIsAudioPaused(false);
      setAudioStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (isDiscardingAudioRef.current) {
            isDiscardingAudioRef.current = false;
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioDraft(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingAudio(true);
      } catch (error: any) {
        if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission') || error?.message?.includes('denied')) {
          alert("Microphone access was denied. Please allow microphone access to record audio.");
        } else {
          alert("Could not access microphone: " + (error?.message || "Unknown error"));
        }
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  // Handle keyboard opening (which triggers a window resize on many mobile browsers)
  useEffect(() => {
    const handleResize = () => {
      if (view === 'chat') {
        scrollToBottom();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  useEffect(() => {
    socket.connect();
    socket.emit('join', session.username);

    fetchApi('/api/posts').then(setPosts);

    socket.on('new_post', (post) => {
      setPosts(prev => [post, ...prev]);
    });

    socket.on('delete_post', (postId) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
    });

    socket.on('new_message', (msg) => {
      if (activeChat && (msg.senderUsername === activeChat || msg.receiverUsername === activeChat)) {
        setMessages(prev => [...prev, msg]);
      }
      
      if (msg.receiverUsername === session.username) {
        if (view === 'chat' && activeChat === msg.senderUsername) {
          socket.emit('messages_seen', { from: session.username, to: msg.senderUsername });
        } else {
          socket.emit('message_delivered', { messageId: msg.id, senderUsername: msg.senderUsername });
        }
      }
    });

    socket.on('message_status_update', ({ messageId, status }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
    });

    socket.on('messages_seen', ({ by }) => {
      setMessages(prev => prev.map(msg => 
        (msg.receiverUsername === by && msg.senderUsername === session.username && msg.status !== 'seen') 
          ? { ...msg, status: 'seen' } 
          : msg
      ));
    });

    socket.on('message_reaction', (reactionData) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === reactionData.messageId) {
          const newReactions = msg.reactions || [];
          if (reactionData.removed) {
            return { ...msg, reactions: newReactions.filter((r: any) => !(r.username === reactionData.username && r.emoji === reactionData.emoji)) };
          } else {
            return { ...msg, reactions: [...newReactions, reactionData] };
          }
        }
        return msg;
      }));
    });

    socket.on('typing', (data) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.username === data.username)) {
          return [...prev, { username: data.username, avatar: data.avatar, color: data.color }];
        }
        return prev;
      });
    });

    socket.on('stop_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.username !== data.username));
    });

    return () => {
      socket.disconnect();
      socket.off('new_post');
      socket.off('delete_post');
      socket.off('new_message');
      socket.off('message_reaction');
      socket.off('message_status_update');
      socket.off('messages_seen');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [session, activeChat, view]);

  useEffect(() => {
    if (activeChat) {
      fetchApi(`/api/messages/${activeChat}`).then(setMessages);
    }
  }, [activeChat]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delay = setTimeout(() => {
        fetchApi(`/api/users/search?q=${encodeURIComponent(searchQuery)}`).then(res => { console.log('Search results:', res); setSearchResults(res); }).catch(err => console.error('Search error:', err));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSend = async () => {
    if (!composerText.trim() && !file) return;
    setIsSending(true);
    
    const formData = new FormData();
    if (composerText) formData.append('content', composerText);
    if (file) formData.append('file', file);

    try {
      if (view === 'feed') {
        await fetchApi('/api/posts', {
          method: 'POST',
          body: formData,
        });
      } else if (view === 'chat' && activeChat) {
        await fetchApi(`/api/messages/${activeChat}`, {
          method: 'POST',
          body: formData,
        });
      }
      setComposerText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setFile(null);
      if (view === 'chat' && activeChat && isTyping) {
        setIsTyping(false);
        socket.emit('stop_typing', { from: session.username, to: activeChat });
        clearTimeout((window as any).typingTimeout);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const deletePost = async (id: string) => {
    await fetchApi(`/api/posts/${id}`, { method: 'DELETE' });
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetchApi(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (e) {
      console.error(e);
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
        socket.emit('typing', { from: session.username, to: activeChat, avatar: session.avatar, color: session.color });
      }
      
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop_typing', { from: session.username, to: activeChat });
      }, 2000);
    }
  };

  const openChat = (username: string) => {
    setActiveChat(username);
    setView('chat');
    setSearchQuery('');
    setChatSearchQuery('');
  };

  return (
    <>
      <AnimatePresence>
        

        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-10">
              <button onClick={closeCamera} className="text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 flex justify-center items-center">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white/50 bg-white/20 hover:bg-white hover:border-white transition-all flex items-center justify-center group"
              >
                <div className="w-12 h-12 bg-white rounded-full group-hover:scale-95 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-screen w-full bg-neutral-950 text-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / Topbar */}
      <div className={clsx(
        "w-full md:w-80 bg-neutral-900 border-b md:border-b-0 md:border-r border-white/10 flex-col flex-shrink-0",
        view === 'chat' ? 'hidden md:flex' : 'flex'
      )}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-xl", session.color)}>
              {session.avatar}
            </div>
            <div>
              <div className="font-medium">{session.username}</div>
              <div className="text-xs text-neutral-400">
                Expires in <Countdown expiresAt={session.expiresAt} />
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 relative z-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
            />
            {(searchResults.length > 0 || searchQuery.length > 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  searchResults.map(res => (
                    <button 
                      key={res.username}
                      onClick={() => openChat(res.username)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center space-x-3 transition-colors"
                    >
                      <div className={clsx("w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-sm", res.color)}>
                        {res.avatar}
                      </div>
                      <span>{res.username}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-neutral-400 flex flex-col items-center justify-center bg-neutral-800">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-neutral-300">No users found</p>
                    <p className="text-xs text-neutral-500 mt-1">Try a different username</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="p-2 space-y-1">
          <button 
            onClick={() => setView('feed')}
            className={clsx("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", view === 'feed' ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")}
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">Public Feed</span>
          </button>
          {activeChat && (
            <button 
              onClick={() => setView('chat')}
              className={clsx("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", view === 'chat' ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")}
            >
              <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center text-[10px]">💬</div>
              <span className="font-medium truncate">{activeChat}</span>
            </button>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={clsx(
        "flex-1 flex-col relative h-full overflow-hidden",
        view === 'feed' ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/10 flex-shrink-0 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            {view === 'chat' && (
              <button 
                onClick={() => setView('feed')}
                className="md:hidden mr-3 p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {view === 'feed' ? 'Public Feed' : `Chat with ${activeChat}`}
            </h2>
          </div>
          
          {view === 'chat' && (
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
              />
            </div>
          )}
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-24 space-y-6" onClick={() => setActiveMenuMsg(null)} onScroll={() => setActiveMenuMsg(null)}>
          {view === 'feed' ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {posts.map((post) => (
                <DissolvingItem 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={post.id} 
                  expiresAt={post.expiresAt}
                  className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl relative group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-lg", post.color)}>
                        {post.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{post.username}</div>
                        <div className="text-xs text-neutral-500">
                          <Countdown expiresAt={post.expiresAt} />
                        </div>
                      </div>
                    </div>
                    {post.sessionId === session.id && (
                      <button 
                        onClick={() => deletePost(post.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {post.content && (
                    <p className="text-neutral-200 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                  )}
                  {post.fileUrl && (
                    <div className="rounded-xl overflow-hidden bg-neutral-950 border border-white/5">
                      {post.fileType?.startsWith('image/') ? (
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
                      )}
                    </div>
                  )}
                </DissolvingItem>
              ))}
              {posts.length === 0 && (
                <div className="text-center text-neutral-500 py-12">No posts yet. Be the first to share!</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col space-y-4 max-w-3xl mx-auto">
              {messages.filter(msg => msg.content?.toLowerCase().includes(chatSearchQuery.toLowerCase()) || msg.fileName?.toLowerCase().includes(chatSearchQuery.toLowerCase())).map((msg) => {
                const isMe = msg.senderUsername === session.username;
                
                // Group reactions by emoji
                const reactionCounts: Record<string, { count: number, reacted: boolean }> = {};
                (msg.reactions || []).forEach((r: any) => {
                  if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, reacted: false };
                  reactionCounts[r.emoji].count++;
                  if (r.username === session.username) reactionCounts[r.emoji].reacted = true;
                });

                return (
                  <DissolvingItem 
                    key={msg.id} 
                    expiresAt={msg.expiresAt}
                    className={clsx("flex flex-col max-w-[80%] group", isMe ? "self-end items-end" : "self-start items-start")}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuMsg(activeMenuMsg === msg.id ? null : msg.id);
                    }}
                  >
                    <div className={clsx("flex items-end space-x-2 relative", isMe && "flex-row-reverse space-x-reverse")}>
                      <div 
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          toggleReaction(msg.id, quickEmojis[0] || '❤️');
                        }}
                        className={clsx(
                          "px-4 py-2.5 rounded-2xl text-[15px] relative transition-transform active:scale-[0.98]",
                          isMe ? "bg-white text-black rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
                        )}
                      >
                        {msg.content && <div className="whitespace-pre-wrap">{highlightText(msg.content, chatSearchQuery)}</div>}
                        {msg.fileUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            {msg.fileType?.startsWith('image/') ? (
                              <img src={msg.fileUrl} alt="attachment" className="max-w-full rounded-md cursor-pointer" onClick={() => setViewingImage(msg.fileUrl)} />
                            ) : msg.fileType?.startsWith('audio/') ? (
                              <AudioPlayer src={msg.fileUrl} />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline opacity-80">{msg.fileName}</a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions (Reactions & Copy) */}
                      <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 mb-1 flex items-center space-x-1", isMe ? "right-full mr-2" : "left-full ml-2")}>
                        {/* Desktop Hover Row & Mobile Tap Row */}
                        <div className={clsx("absolute bottom-full mb-2 items-center bg-[#262626] px-1.5 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-50 transition-all", activeMenuMsg === msg.id ? "flex opacity-100 translate-y-0" : "hidden", isMe ? "right-0" : "left-0")}>
                          {Array.from(new Set(quickEmojis)).slice(0, 6).map((emoji: any) => (
                            <button 
                              key={emoji}
                              onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 active:scale-75 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1.5"></div>
                          <button 
                            onClick={() => { setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}
                            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-neutral-400 hover:text-white transition-colors ml-0.5"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        

                        
                        {msg.content && (
                          <button 
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10 transition-colors"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reactions Display */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className={clsx("flex flex-wrap gap-1 mt-1 z-10", isMe ? "justify-end mr-2" : "justify-start ml-2")}>
                        {Object.entries(reactionCounts).map(([emoji, { count, reacted }]) => (
                          <button
                            key={emoji}
                            onClick={() => { toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                            className={clsx(
                              "flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 transition-transform active:scale-90",
                              reacted ? "bg-white/20 text-white" : "bg-neutral-900 text-neutral-300 hover:bg-white/10"
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="font-medium">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center space-x-1.5">
                      <span>{new Date(msg.createdAt.replace(' ', 'T') + (!msg.createdAt.endsWith('Z') ? 'Z' : '')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <Countdown expiresAt={msg.expiresAt} />
                      {isMe && (
                        <div className="flex items-center space-x-1 pl-0.5">
                          <AnimatePresence mode="wait" initial={false}>
                            {msg.status === 'seen' ? (
                              <motion.div key="seen" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              </motion.div>
                            ) : msg.status === 'delivered' ? (
                              <motion.div key="delivered" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                                <Check className="w-3 h-3" />
                              </motion.div>
                            ) : (
                              <motion.div key="sent" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                                <Check className="w-3 h-3 opacity-50" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </DissolvingItem>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {file && (
              <div className="mb-2 relative inline-flex group items-end">
                {filePreviewUrl ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-neutral-900 shadow-xl ml-2">
                    <img src={filePreviewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[#212121] border border-white/10 rounded-xl flex flex-col items-center justify-center p-2 text-center shadow-xl ml-2">
                    <svg className="w-6 h-6 text-neutral-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px] text-neutral-300 truncate w-full px-1">{file.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => setFile(null)} 
                  className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-neutral-700 transition-colors shadow-lg z-10 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <AnimatePresence>
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
            </AnimatePresence>
            
            <div className="flex items-end space-x-3">
              <div className="flex-1 flex items-end bg-[#212121] rounded-[24px] px-1.5 py-1.5 shadow-2xl relative">
                
                <div className="flex items-center pl-1 pr-2 pb-1.5 flex-shrink-0 self-end">
                  <div className="relative">
                    {/* Plus Menu Popup */}
                    {isMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-3 w-[180px] bg-[#2f2f2f] rounded-[16px] overflow-hidden shadow-2xl z-50">
                        <div className="py-2 flex flex-col">
                          <button onClick={handleDriveClick} className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors">
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
                            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setIsMenuOpen(false); }} />
                          </label>
                          <button onClick={openCustomCamera} className="w-full px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 text-[15px] text-neutral-200 transition-colors">
                            <Camera className="w-4 h-4 text-neutral-400" />
                            <span>Camera</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={clsx("w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors", isMenuOpen && "bg-white/10 text-white")}
                      title="Add files and more"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] px-1 py-2 placeholder-neutral-400 outline-none text-white resize-none min-h-[40px] max-h-32 self-center"
                />

                <div className="flex items-center space-x-1 pr-1 pb-1.5 flex-shrink-0 self-end">
                  <button 
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
                onClick={handleSend}
                disabled={isSending || (!composerText.trim() && !file)}
                className="w-12 h-12 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0 flex items-center justify-center shadow-lg"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : composerText.trim() || file ? (
                  <Send className="w-5 h-5 ml-0.5" />
                ) : (
                  <AudioLines className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {view === 'chat' && typingUsers.length > 0 && (
              <div className="absolute bottom-full mb-2 left-4 z-10 flex items-center space-x-2 text-[12px] text-neutral-400 bg-neutral-900/90 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-lg">
                <div className="flex -space-x-1.5">
                  {typingUsers.map((user, i) => (
                    <div 
                      key={user.username} 
                      className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-2 ring-neutral-900 relative", user.color)} 
                      style={{ zIndex: 10 - i }}
                    >
                      {user.avatar}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-1 ml-1">
                  <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-1 opacity-80">{typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setViewingImage(null)}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={viewingImage}
              alt="Full screen view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}

      </AnimatePresence>
            {/* Full Emoji Picker & Customization Modal */}
      <AnimatePresence>
        {activeReactionMsgFull && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm sm:p-4"
            onClick={() => { setActiveReactionMsgFull(null); setIsCustomizing(false); }}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border-t sm:border border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full sm:max-w-sm"
              style={{ maxHeight: "85vh" }}
            >
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">Your reactions</h3>
                <button 
                  onClick={() => setIsCustomizing(!isCustomizing)} 
                  className={clsx("text-sm font-medium", isCustomizing ? "text-blue-400" : "text-blue-500 hover:text-blue-400")}
                >
                  {isCustomizing ? "Done" : "Customize"}
                </button>
              </div>
              
              <div className="px-4 pb-4 border-b border-white/10">
                {isCustomizing && <p className="text-xs text-neutral-400 mb-2">Click an emoji to remove it, or pick below to add.</p>}
                <div className="flex items-center justify-between space-x-1">
                  {quickEmojis.map((emoji, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (isCustomizing) {
                          const newEmojis = quickEmojis.filter((_, i) => i !== idx);
                          setQuickEmojis(newEmojis);
                          localStorage.setItem('quickEmojis', JSON.stringify(newEmojis));
                        } else {
                          toggleReaction(activeReactionMsgFull, emoji);
                          setActiveReactionMsgFull(null);
                        }
                      }}
                      className={clsx(
                        "w-11 h-11 flex items-center justify-center rounded-full text-2xl transition-all transform active:scale-90",
                        isCustomizing ? "bg-neutral-800 hover:bg-neutral-700 border border-white/5 relative group" : "hover:bg-white/10 hover:scale-110"
                      )}
                    >
                      {emoji}
                      {isCustomizing && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                  {isCustomizing && quickEmojis.length < 6 && (
                    <div className="w-11 h-11 flex flex-1 items-center justify-center border border-dashed border-neutral-600 rounded-full text-neutral-500">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-0 overflow-hidden flex-1 bg-neutral-900">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData) => {
                    // We dispatch a custom event to get the latest state since this callback is cached by EmojiPicker
                    const evt = new CustomEvent('emoji_picker_click', { detail: emojiData.emoji });
                    window.dispatchEvent(evt);
                  }}
                  width="100%"
                  height="400px"
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
    </>
  );
}
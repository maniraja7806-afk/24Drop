import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, LogOut, Send, Image as ImageIcon, X, Trash2, Plus, Mic, AudioLines, Sparkles, Telescope, Cpu, Paperclip, Check, CheckCheck, Copy, Loader2, Triangle, Upload, Camera, Square, Play, Pause, Pin, PinOff } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { socket } from '../lib/socket';
import { Countdown } from './Countdown';
import clsx from 'clsx';
import { initAuth, googleSignIn, getAccessToken } from '../lib/auth';
import { loadPickerApi, openPicker } from '../lib/picker';
import { AudioVisualizer } from './AudioVisualizer';
import { Composer } from './Composer';
import { LargeAudioVisualizer } from './LargeAudioVisualizer';
import { AudioTrimmer } from './AudioTrimmer';
import { RecordingTimer } from './RecordingTimer';
import { AudioPlayer } from './AudioPlayer';
import { ImageCropper } from './ImageCropper';
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
  useEffect(() => {
    socket.connect();
    const onConnect = () => socket.emit('join', session.username);
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off('connect', onConnect);
      socket.disconnect();
    };
  }, [session.username]);
  const [view, setView] = useState<'feed' | 'chat' | 'global_search'>('feed');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any>({ posts: [], messages: [] });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        fetchApi(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
          .then(setSearchResults)
          .catch(console.error);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  const [chats, setChats] = useState<any[]>([]);
  
  const fetchChats = () => {
    fetchApi('/api/chats').then(setChats).catch(console.error);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const handleGlobalNewMessage = (msg: any) => {
      fetchChats();
    };
    socket.on("new_message", handleGlobalNewMessage);
    return () => {
      socket.off("new_message", handleGlobalNewMessage);
    };
  }, []);

  const [posts, setPosts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [storageUsage, setStorageUsage] = useState<{usageBytes: number, limitBytes: number} | null>(null);

  useEffect(() => {
    fetchApi('/api/storage/usage').then(setStorageUsage).catch(console.error);
    const interval = setInterval(() => {
      fetchApi('/api/storage/usage').then(setStorageUsage).catch(console.error);
    }, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globalSearchQuery.length > 2) {
      const timer = setTimeout(() => {
        fetchApi(`/api/search?q=${encodeURIComponent(globalSearchQuery)}`)
          .then(setGlobalSearchResults)
          .catch(console.error);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setGlobalSearchResults({ posts: [], messages: [] });
    }
  }, [globalSearchQuery]);

  useEffect(() => {
    fetchApi("/api/posts").then(setPosts).catch(console.error);
    socket.on("new_post", (post) => setPosts((p) => [post, ...p]));
    socket.on("delete_post", (id) => setPosts((p) => p.filter((x) => x.id !== id)));
    return () => {
      socket.off("new_post");
      socket.off("delete_post");
    };
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    fetchApi(`/api/messages/${activeChat}`).then(setMessages).catch(console.error);
    const handleNewMessage = (msg: any) => {
      console.log('Received new_message:', msg, 'activeChat:', activeChat);
      if (msg.senderUsername === activeChat || msg.receiverUsername === activeChat) {
        setMessages((m) => {
          if (m.find((x) => x.id === msg.id)) return m;
          return [...m, msg];
        });
      }
    };
    const handleReaction = ({ messageId, username, emoji, removed }: any) => {
      setMessages((m) =>
        m.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = msg.reactions || [];
          if (removed) {
            return { ...msg, reactions: reactions.filter((r: any) => !(r.username === username && r.emoji === emoji)) };
          } else {
            return { ...msg, reactions: [...reactions, { username, emoji }] };
          }
        })
      );
    };
    
    const handleMessagesSeen = ({ by, seenAt }: any) => {
      setMessages((m) => m.map(msg => {
        if (msg.senderUsername === session.username && msg.receiverUsername === by && msg.status !== 'seen') {
          return { ...msg, status: 'seen', seenAt };
        }
        return msg;
      }));
    };
    
    const handleStatusUpdate = ({ messageId, status }: any) => {
      setMessages((m) => m.map(msg => msg.id === messageId ? { ...msg, status } : msg));
    };

    const handleMessagePinned = ({ messageId, isPinned }: any) => {
      setMessages((m) => m.map(msg => msg.id === messageId ? { ...msg, isPinned } : msg));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_reaction", handleReaction);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("message_status_update", handleStatusUpdate);
    socket.on("message_pinned", handleMessagePinned);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_reaction", handleReaction);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("message_status_update", handleStatusUpdate);
      socket.off("message_pinned", handleMessagePinned);
    };
  }, [activeChat]);

  useEffect(() => {
    const handleTyping = ({ from, avatar, color }: any) => {
      if (view === "chat" && from === activeChat) {
        setTypingUsers((prev) => {
          if (prev.find((u) => u.username === from)) return prev;
          return [...prev, { username: from, avatar, color }];
        });
      }
    };
    const handleStopTyping = ({ from }: any) => {
      setTypingUsers((prev) => prev.filter((u) => u.username !== from));
    };
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [view, activeChat]);

  
  const [file, setFile] = useState<File | null>(null);

  const [typingUsers, setTypingUsers] = useState<{username: string, avatar: string, color: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [viewingFile, setViewingFile] = useState<{url: string, type: string, name: string} | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    if (viewingFile) {
      setIsPreviewLoading(true);
      if (!viewingFile.type?.startsWith('image/') && viewingFile.type !== 'application/pdf' && !viewingFile.type?.startsWith('video/') && !viewingFile.type?.startsWith('audio/')) {
        setIsPreviewLoading(false);
      }
    }
  }, [viewingFile]);
  
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [audioDraft, setAudioDraft] = useState<Blob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isDiscardingAudioRef = useRef(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);
  const [quickEmojis, setQuickEmojis] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickEmojis');
    return saved ? JSON.parse(saved) : ['👍', '❤️', '😂', '😮', '😢', '🔥'];
  });
  const [isCustomizingEmojis, setIsCustomizingEmojis] = useState(false);

  const [activeReactionMsgFull, setActiveReactionMsgFull] = useState<string | null>(null);
  const [activeMenuMsg, setActiveMenuMsg] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((view === 'chat' || activeThread) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view, activeThread]);

  const togglePin = async (messageId: string) => {
    try {
      await fetchApi(`/api/messages/${messageId}/pin`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to pin:', err);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetchApi(`/api/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setCropImageSrc(url);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await fetchApi(`/api/posts/${postId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDiscardAudio = () => {
    isDiscardingAudioRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
      setAudioStream(null);
    }
    setIsRecordingAudio(false);
    setAudioDraft(null);
  };

  const handlePauseResumeAudio = () => {
    if (mediaRecorderRef.current) {
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecordingAudio(true);
      setIsAudioPaused(false);
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (isDiscardingAudioRef.current) {
          isDiscardingAudioRef.current = false;
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioDraft(audioBlob);
        setIsRecordingAudio(false);
        stream.getTracks().forEach(t => t.stop());
        setAudioStream(null);
      };
      
      mediaRecorder.start(100);
    } catch (err) {
      console.error("Error accessing mic:", err);
    }
  };

  const openCustomCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (e) {
      console.error("Camera access denied", e);
    }
  };



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


  const openChat = (username: string, color?: string, avatar?: string) => {
    setActiveChat(username);
    setView('chat');
    setActiveThread(null);
    setSearchQuery('');
    setChatSearchQuery('');
    
    setChats(prev => {
      if (prev.find(c => c.username === username)) return prev;
      return [{ username, color: color || 'bg-neutral-500', avatar: avatar || '👤' }, ...prev].slice(0, 20);
    });
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
              <button aria-label="Close camera" onClick={closeCamera} className="text-white p-2">
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
                aria-label="Capture photo"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white/50 bg-white/20 hover:bg-white hover:border-white transition-all flex items-center justify-center group"
              >
                <div className="w-12 h-12 bg-white rounded-full group-hover:scale-95 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={(f) => {
            setFile(f);
            setCropImageSrc(null);
            closeCamera();
          }}
          onCancel={() => {
            setCropImageSrc(null);
          }}
        />
      )}

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
          <button aria-label="Logout" onClick={onLogout} className="p-2 text-neutral-400 hover:text-white transition-colors">
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
                      onClick={() => openChat(res.username, res.color, res.avatar)}
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
            onClick={() => { setView('feed'); setActiveThread(null); }}
            className={clsx("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", view === 'feed' ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")}
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">Public Feed</span>
          </button>
          {chats.map((chat: any) => (
            <button 
              key={chat.username}
              onClick={() => { openChat(chat.username, chat.color, chat.avatar); }}
              className={clsx("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", view === 'chat' && activeChat === chat.username ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")}
            >
              <div className={clsx("w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center text-[10px]", chat.color)}>
                {chat.avatar}
              </div>
              <span className="font-medium truncate">{chat.username}</span>
            </button>
          ))}
        </nav>
        
        {storageUsage && (
          <div className="p-4 mt-auto border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>Storage (25GB)</span>
              <span>{(storageUsage.usageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB used</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className={clsx(
                  "h-full transition-all duration-500",
                  (storageUsage.usageBytes / storageUsage.limitBytes) > 0.9 ? "bg-red-500" : "bg-blue-500"
                )} 
                style={{ width: `${Math.min(100, (storageUsage.usageBytes / storageUsage.limitBytes) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={clsx(
        "flex-1 flex-col relative h-full overflow-hidden",
        view === 'feed' ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/10 flex-shrink-0 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            {(view === 'chat' || activeThread) && (
              <button 
                aria-label={activeThread ? "Back to chat" : "Back to feed"}
                onClick={() => { if (activeThread) setActiveThread(null); else { setView('feed'); setActiveThread(null); } }}
                className={clsx("mr-3 p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors", !activeThread && "md:hidden")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold leading-tight">
                {activeThread ? 'Thread' : view === 'feed' ? 'Public Feed' : `Chat with ${activeChat}`}
              </h2>
              {view === 'chat' && typingUsers.length > 0 && (
                <span className="text-[13px] text-blue-400 font-medium animate-pulse mt-0.5">
                  {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              )}
            </div>
          </div>
          
          <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Global Search..."
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  if (e.target.value) setView('global_search');
                  else if (view === 'global_search') setView(activeChat ? 'chat' : 'feed');
                }}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
              />
            </div>
        </header>

        {/* Pinned Messages Banner */}
        {view === 'chat' && !activeThread && messages.filter((m: any) => !m.parentId && m.isPinned).length > 0 && (
          <div className="flex-shrink-0 bg-neutral-900 border-b border-white/10 p-2 md:px-6 sticky top-0 z-10 shadow-md">
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
              {messages.filter((m: any) => !m.parentId && m.isPinned).map((msg: any) => (
                <div key={msg.id} className="flex flex-col bg-neutral-800/50 rounded-lg p-2 min-w-[200px] max-w-[250px] flex-shrink-0 border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors group relative" onClick={() => {
                  const el = document.getElementById(`msg-${msg.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950', 'transition-all');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950'), 2000);
                  }
                }}>
                  <button 
                    className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-md transition-all text-neutral-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); togglePin(msg.id); }}
                    title="Unpin"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center space-x-1 text-blue-400 mb-1">
                    <Pin className="w-3 h-3 fill-current rotate-45" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Pinned by {msg.senderUsername}</span>
                  </div>
                  <div className="text-xs text-neutral-300 truncate">
                    {msg.content || (msg.fileName ? `File: ${msg.fileName}` : 'Pinned message')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-24 space-y-6" onClick={() => setActiveMenuMsg(null)} onScroll={() => setActiveMenuMsg(null)}>
          {view === 'global_search' ? (
            <div className="flex flex-col space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-white">Search Results</h3>
              {globalSearchResults.messages.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-neutral-400">Messages</h4>
                  {globalSearchResults.messages.map((msg: any) => (
                    <div key={msg.id} className="bg-neutral-900 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => { setActiveChat(msg.senderUsername === session.username ? msg.receiverUsername : msg.senderUsername); setView('chat'); setGlobalSearchQuery(''); }}>
                      <div className="text-xs text-neutral-500 mb-1">
                        {msg.senderUsername === session.username ? 'You' : msg.senderUsername} to {msg.receiverUsername === session.username ? 'You' : msg.receiverUsername}
                      </div>
                      <div className="text-sm">{msg.content}</div>
                      {msg.fileName && <div className="text-xs text-blue-400 mt-1">{msg.fileName}</div>}
                    </div>
                  ))}
                </div>
              )}
              {globalSearchResults.posts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-neutral-400">Feed Posts</h4>
                  {globalSearchResults.posts.map((post: any) => (
                    <div key={post.id} className="bg-neutral-900 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => { setView('feed'); setGlobalSearchQuery(''); }}>
                      <div className="text-xs text-neutral-500 mb-1">Posted by {post.username}</div>
                      <div className="text-sm">{post.content}</div>
                      {post.fileName && <div className="text-xs text-blue-400 mt-1">{post.fileName}</div>}
                    </div>
                  ))}
                </div>
              )}
              {globalSearchResults.posts.length === 0 && globalSearchResults.messages.length === 0 && (
                <div className="text-neutral-500 text-center py-8">No results found for "{globalSearchQuery}"</div>
              )}
            </div>
          ) : view === 'feed' ? (
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
                        aria-label="Delete post"
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
                        <img loading="lazy" src={post.fileUrl} alt="attachment" className="w-full max-h-96 object-cover cursor-pointer" onClick={() => setViewingFile({ url: post.fileUrl, type: post.fileType, name: post.fileName })} />
                      ) : post.fileType?.startsWith('audio/') ? (
                        <div className="p-4">
                          <AudioPlayer src={post.fileUrl} />
                        </div>
                      ) : (
                        <div className="p-4 flex items-center space-x-3">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <Globe className="w-6 h-6" />
                          </div>
                          <button onClick={() => setViewingFile({ url: post.fileUrl, type: post.fileType, name: post.fileName })} className="text-blue-400 hover:underline flex items-center space-x-2 text-left">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="truncate">{post.fileName}</span>
                            </button>
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
              {(() => {
                const displayedMessages = activeThread
                  ? [activeThread, ...messages.filter((m: any) => m.parentId === activeThread.id)]
                  : messages.filter((msg: any) => !msg.parentId && (chatSearchQuery === '' || msg.content?.toLowerCase().includes(chatSearchQuery.toLowerCase()) || msg.fileName?.toLowerCase().includes(chatSearchQuery.toLowerCase())));
                return displayedMessages.map((msg: any) => {
                const isMe = msg.senderUsername === session.username;
                const isThreadParent = activeThread?.id === msg.id;
                const replyCount = messages.filter((m: any) => m.parentId === msg.id).length;
                
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
                    id={`msg-${msg.id}`}
                    expiresAt={msg.expiresAt}
                    initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
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
                              <img loading="lazy" src={msg.fileUrl} alt="attachment" className="max-w-full rounded-md cursor-pointer" onClick={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })} />
                            ) : msg.fileType?.startsWith('audio/') ? (
                              <AudioPlayer src={msg.fileUrl} />
                            ) : (
                              <button onClick={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })} className="underline opacity-80 hover:opacity-100 flex items-center space-x-2 text-left">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span className="truncate">{msg.fileName}</span>
                              </button>
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
                              aria-label={`React with ${emoji}`}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-[22px] transition-transform hover:scale-110 active:scale-75 transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1.5"></div>
                          <button 
                            aria-label="More reactions"
                            onClick={(e) => { e.stopPropagation(); setActiveReactionMsgFull(msg.id); setIsCustomizing(false); setActiveMenuMsg(null); }}
                            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-neutral-400 hover:text-white transition-colors ml-0.5"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        

                        
                        {msg.content && (
                          <button 
                            aria-label="Copy message text"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-full shadow-md border border-white/10 transition-colors"
                            title="Copy message text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          aria-label={msg.isPinned ? "Unpin message" : "Pin message"}
                          onClick={() => togglePin(msg.id)}
                          className={clsx("p-1.5 rounded-full shadow-md border border-white/10 transition-colors", msg.isPinned ? "text-blue-400 bg-blue-900/20 border-blue-500/30" : "text-neutral-500 hover:text-white bg-neutral-900")}
                          title={msg.isPinned ? "Unpin message" : "Pin message"}
                        >
                          {msg.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Reactions Display */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className={clsx("flex flex-wrap gap-1 mt-1 z-10", isMe ? "justify-end mr-2" : "justify-start ml-2")}>
                        {Object.entries(reactionCounts).map(([emoji, { count, reacted }]) => (
                          <button
                            key={emoji}
                            aria-label={`React with ${emoji}`}
                            onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); setActiveMenuMsg(null); }}
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
                      {msg.isPinned && (
                        <div className="flex items-center text-blue-400" title="Pinned message">
                          <Pin className="w-3 h-3 fill-current rotate-45" />
                        </div>
                      )}
                      <span>{new Date(msg.createdAt.replace(' ', 'T') + (!msg.createdAt.endsWith('Z') ? 'Z' : '')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!activeThread && replyCount > 0 && (
                        <>
                          <span>•</span>
                          <button onClick={() => setActiveThread(msg)} className="text-blue-400 hover:underline">
                            {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
                          </button>
                        </>
                      )}
                      <Countdown expiresAt={msg.expiresAt} />
                      {isMe && (
                        <div className="flex items-center space-x-1 pl-0.5">
                          <AnimatePresence mode="wait" initial={false}>
                            {msg.status === 'seen' ? (
                              <motion.div 
                                key="seen" 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.8 }} 
                                transition={{ duration: 0.2 }}
                                title={msg.seenAt ? `Read at ${new Date(msg.seenAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}` : 'Read'}
                              >
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
              });
              })()}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer Footer */}
        {view !== 'global_search' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent">
          <div className="max-w-3xl mx-auto relative">
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
                       <LargeAudioVisualizer stream={audioStream} isPaused={isAudioPaused} />
                    </div>

                    <div className="flex items-center justify-between w-full px-6">
                      <div className="flex items-center space-x-3">
                        <button 
                          aria-label="Discard audio"
                          onClick={handleDiscardAudio}
                          className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button 
                          aria-label={isAudioPaused ? 'Resume recording' : 'Pause recording'}
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
                        aria-label="Finish recording"
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
            
            <Composer 
              view={view}
              activeChat={activeChat}
              parentId={activeThread?.id}
              session={session}
              file={file}
              setFile={setFile}
              openCustomCamera={openCustomCamera}
              handleMicClick={handleMicClick}
              setToastMessage={setToastMessage}
            />
          </div>
        </div>
      )}
      </div>

      <AnimatePresence>
        {viewingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setViewingFile(null)}
          >
            <button
              aria-label="Close preview"
              onClick={() => setViewingFile(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-neutral-800/80 hover:bg-neutral-700/80 backdrop-blur rounded-full text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl h-full max-h-[90vh] bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md">
                <div className="font-medium truncate text-white">{viewingFile.name}</div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(viewingFile.url);
                      setToastMessage('Link copied to clipboard');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                  <a 
                    href={viewingFile.url} 
                    download={viewingFile.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Download</span>
                  </a>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center p-4 relative">
                {isPreviewLoading && viewingFile.type !== 'application/pdf' && !viewingFile.type?.startsWith('image/') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
                  </div>
                )}
                {isPreviewLoading && (viewingFile.type === 'application/pdf' || viewingFile.type?.startsWith('image/')) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-10 pointer-events-none">
                    <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
                  </div>
                )}
                {viewingFile.type?.startsWith('image/') ? (
                  <img onLoad={() => setIsPreviewLoading(false)} src={viewingFile.url} alt={viewingFile.name} className="max-w-full max-h-full object-contain rounded" />
                ) : viewingFile.type === 'application/pdf' ? (
                  <iframe onLoad={() => setIsPreviewLoading(false)} src={viewingFile.url} className="w-full h-full rounded border-0 bg-white" title={viewingFile.name} />
                ) : viewingFile.type?.startsWith('video/') ? (
                  <video onCanPlay={() => setIsPreviewLoading(false)} src={viewingFile.url} controls className="max-w-full max-h-full" />
                ) : viewingFile.type?.startsWith('audio/') ? (
                  <audio onCanPlay={() => setIsPreviewLoading(false)} src={viewingFile.url} controls className="w-full max-w-md" />
                ) : (
                  <div className="text-center text-neutral-400" onLoad={() => setIsPreviewLoading(false)}>
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No preview available for this file type.</p>
                    <p className="text-xs mt-2 opacity-70">{viewingFile.type}</p>
                  </div>
                )}
              </div>
            </motion.div>
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
                      aria-label={isCustomizing ? `Remove ${emoji} from quick reactions` : `React with ${emoji}`}
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
            {toastMessage.toLowerCase().includes("fail") || toastMessage.toLowerCase().includes("error") ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-green-400" />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
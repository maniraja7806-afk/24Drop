import { useChatScroll } from '../hooks/useChatScroll';
import { useChatSocket } from '../hooks/useChatSocket';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, LogOut, Send, Image as ImageIcon, X, Trash2, Edit2, Plus, Mic, AudioLines, Sparkles, Telescope, Cpu, Paperclip, Check, CheckCheck, Copy, Loader2, Triangle, Upload, Camera, Square, Play, Pause, Pin, PinOff, Smile, Database, Reply, ChevronDown } from 'lucide-react';
import { fetchApi, syncOfflineRequests } from '../lib/api';
import { socket } from '../lib/socket';
import { formatBytes } from '../lib/format';
import { Countdown } from './Countdown';
import { format } from 'date-fns';
import clsx from 'clsx';
import { initAuth, googleSignIn, getAccessToken } from '../lib/auth';
import { loadPickerApi, openPicker } from '../lib/picker';
import { AudioVisualizer } from './AudioVisualizer';
import { PullToRefresh } from './PullToRefresh';
import { Composer } from './Composer';
import { LargeAudioVisualizer } from './LargeAudioVisualizer';
import { AudioTrimmer } from './AudioTrimmer';
import { RecordingTimer } from './RecordingTimer';
import { AudioPlayer } from './AudioPlayer';
import { ImageCropper } from './ImageCropper';
import { DissolvingItem } from './DissolvingItem';
import { FileAttachmentView } from './FileAttachmentView';
import { FolderAttachmentView } from './FolderAttachmentView';
import { ReactionPickerPopup, ReactionBubblePill, ReactedUsersModal, getCustomReactions } from './ReactionSystem';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const formatStorageDisplay = (bytes: number, limitBytes: number = 25 * 1024 * 1024 * 1024) => {
  const limitGB = (limitBytes / (1024 * 1024 * 1024)).toFixed(0);
  if (!bytes || bytes <= 0) {
    return `0.00 GB used of ${limitGB} GB`;
  }
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 0.01) {
    return `${gb.toFixed(2)} GB used of ${limitGB} GB`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) {
    return `${mb.toFixed(2)} MB used of ${limitGB} GB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB used of ${limitGB} GB`;
};

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
    const onConnect = () => { socket.emit('join', session.username); syncOfflineRequests(); };
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off('connect', onConnect);
      socket.disconnect();
    };
  }, [session.username]);
  const [view, setView] = useState<'feed' | 'chat' | 'global_search'>('feed');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);
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


  


  

  const [posts, setPosts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [storageUsage, setStorageUsage] = useState<{usageBytes: number, limitBytes: number, categories?: { images: number; videos: number; audio: number; documents: number; others: number }} | null>(null);
  const [showClearStorageModal, setShowClearStorageModal] = useState(false);

  useEffect(() => {
    setReplyToMessage(null);
  }, [activeChat]);

  

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

  

  

  

  
  const [file, setFile] = useState<File | null>(null);

  const [typingUsers, setTypingUsers] = useState<{username: string, avatar: string, color: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [viewingFile, setViewingFile] = useState<{url: string, type: string, name: string, downloadUrl?: string} | null>(null);
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
  
    const [activeMenuMsg, setActiveMenuMsg] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    scrollContainerRef,
    isAtBottom,
    unreadCount,
    setUnreadCount,
    scrollToBottom,
    handleScroll
  } = useChatScroll({
    messages,
    posts,
    view,
    activeChat,
    activeThread,
    onScrollAction: () => setActiveMenuMsg(null)
  });

  useChatSocket({
    session,
    activeChat,
    view,
    setPosts,
    setMessages,
    setTypingUsers,
    setToastMessage,
    setStorageUsage,
    fetchChats,
    scrollToBottom
  });


  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null);
  const [activeReactionAnimation, setActiveReactionAnimation] = useState<{ id: string; emoji: string; key: number } | null>(null);
  const msgLongPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const [activeReactedUsersItem, setActiveReactedUsersItem] = useState<{ id: string; reactions: any[]; isPost: boolean } | null>(null);

  const togglePin = async (messageId: string) => {
    try {
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;
      const currentPinnedState = msg.isPinned;
      
      // Optimistic update
      setMessages((m) => m.map(m => m.id === messageId ? { ...m, isPinned: currentPinnedState ? 0 : 1 } : m));
      
      const res = await fetchApi(`/api/messages/${messageId}/pin`, {
        method: 'POST',
      });
      if (!res.success) {
        // Revert on failure
        setMessages((m) => m.map(m => m.id === messageId ? { ...m, isPinned: currentPinnedState } : m));
      }
    } catch (err) {
      console.error('Failed to pin:', err);
    }
  };

  const togglePostPin = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const currentPinnedState = post.isPinned;
      
      setPosts((p) => p.map(p => p.id === postId ? { ...p, isPinned: currentPinnedState ? 0 : 1 } : p));
      
      const res = await fetchApi(`/api/posts/${postId}/pin`, {
        method: 'POST',
      });
      if (!res.success) {
        setPosts((p) => p.map(p => p.id === postId ? { ...p, isPinned: currentPinnedState } : p));
      }
    } catch (err) {
      console.error('Failed to pin post:', err);
    }
  };

  const triggerReactionAnimation = (id: string, emoji: string) => {
    setActiveReactionAnimation({ id, emoji, key: Date.now() });
    setTimeout(() => {
      setActiveReactionAnimation((prev) => (prev?.id === id ? null : prev));
    }, 900);
  };

  const toggleMessageReaction = async (messageId: string, emoji: string) => {
    triggerReactionAnimation(messageId, emoji);

    // Optimistic update
    setMessages((m) =>
      m.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions || [];
        const existing = reactions.find((r: any) => r.username === session.username);
        if (existing && existing.emoji === emoji) {
          return { ...msg, reactions: reactions.filter((r: any) => r.username !== session.username) };
        } else {
          const cleaned = reactions.filter((r: any) => r.username !== session.username);
          return { ...msg, reactions: [...cleaned, { username: session.username, emoji }] };
        }
      })
    );

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

  const togglePostReaction = async (postId: string, emoji: string) => {
    triggerReactionAnimation(postId, emoji);

    // Optimistic update
    setPosts((p) =>
      p.map((post) => {
        if (post.id !== postId) return post;
        const reactions = post.reactions || [];
        const existing = reactions.find((r: any) => r.username === session.username);
        if (existing && existing.emoji === emoji) {
          return { ...post, reactions: reactions.filter((r: any) => r.username !== session.username) };
        } else {
          const cleaned = reactions.filter((r: any) => r.username !== session.username);
          return { ...post, reactions: [...cleaned, { username: session.username, emoji }] };
        }
      })
    );

    try {
      await fetchApi(`/api/posts/${postId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const copyMessage = (messageId: string, content: string) => {
    const textToCopy = content || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedMessageId(messageId);
    setTimeout(() => {
      setCopiedMessageId((prev) => prev === messageId ? null : prev);
    }, 2000);
  };

  const startEditing = (msg: any) => {
    setEditingMessageId(msg.id);
    setEditMessageContent(msg.content || msg.fileName || '');
  };

  const saveEdit = async (itemId: string) => {
    try {
      const newContent = editMessageContent;
      const isPost = posts.some(p => p.id === itemId);
      if (isPost) {
        setPosts((p) => p.map((post) => post.id === itemId ? { ...post, content: newContent } : post));
        await fetchApi(`/api/posts/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({ content: newContent }),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        setMessages((m) => m.map((msg) => msg.id === itemId ? { ...msg, content: newContent, isEdited: 1 } : msg));
        const res = await fetchApi(`/api/messages/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({ content: newContent }),
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.success && res.content !== undefined) {
          setMessages((m) => m.map((msg) => msg.id === itemId ? { ...msg, content: res.content, isEdited: 1 } : msg));
        }
      }
    } catch (err) {
      console.error('Failed to edit:', err);
    } finally {
      setEditingMessageId(null);
      setEditMessageContent('');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      setMessages((m) => m.filter((msg) => msg.id !== messageId));
      await fetchApi(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      setPosts((p) => p.filter((post) => post.id !== postId));
      await fetchApi(`/api/posts/${postId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
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
    initAuth();
    loadPickerApi(() => undefined);
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

      <div className="h-full w-full bg-neutral-950 text-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / Topbar */}
      <div className={clsx(
        "w-full md:w-80 bg-neutral-900 border-b md:border-b-0 md:border-r border-white/10 flex-col flex-shrink-0 flex-1 md:flex-none",
        mobileShowSidebar ? 'flex' : 'hidden md:flex'
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
                      onClick={() => { openChat(res.username, res.color, res.avatar); setMobileShowSidebar(false); }}
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

        <PullToRefresh className="p-2 space-y-1" onRefresh={async () => { await fetchApi('/api/chats').then(setChats); }}>
          <button 
            onClick={() => { setView('feed'); setActiveThread(null); setMobileShowSidebar(false); }}
            className={clsx("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", view === 'feed' ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")}
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">Public Feed</span>
          </button>
          {chats.map((chat: any) => (
            <button 
              key={chat.username}
              onClick={() => { openChat(chat.username, chat.color, chat.avatar); setMobileShowSidebar(false); }}
              className={clsx("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", view === 'chat' && activeChat === chat.username ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")}
            >
              <div className={clsx("w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center text-[10px]", chat.color)}>
                {chat.avatar}
              </div>
              <span className="font-medium truncate">{chat.username}</span>
            </button>
          ))}
        </PullToRefresh>
        
        {storageUsage && (
          <div className="p-4 mt-auto border-t border-white/10 bg-neutral-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs text-neutral-300 font-medium">
                <Database className="w-3 h-3 text-blue-400" />
                <span>Storage</span>
              </div>
              <span className="text-xs text-neutral-300 font-semibold tracking-tight">
                {formatStorageDisplay(storageUsage.usageBytes, storageUsage.limitBytes)}
              </span>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="relative w-full bg-neutral-950/80 rounded-full h-2.5 overflow-hidden mb-2.5 border border-white/10 p-[1px] shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, Math.max(storageUsage.usageBytes > 0 ? 1 : 0, (storageUsage.usageBytes / storageUsage.limitBytes) * 100))}%` 
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={clsx(
                  "h-full rounded-full transition-colors duration-500 relative",
                  (storageUsage.usageBytes / storageUsage.limitBytes) > 0.9 
                    ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.5)]" 
                    : (storageUsage.usageBytes / storageUsage.limitBytes) > 0.7
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                )}
              />
            </div>

            <button
              onClick={() => setShowClearStorageModal(true)}
              className="w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-500/20 font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Storage</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={clsx(
        "flex-1 flex-col relative h-full overflow-hidden w-full md:w-auto min-w-0",
        !mobileShowSidebar ? 'flex' : 'hidden md:flex'
      )}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-6 border-b border-white/10 flex-shrink-0 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center min-w-0 flex-1 pr-1 sm:pr-3">
            {(view === 'chat' || activeThread || !mobileShowSidebar) && (
              <button 
                aria-label={activeThread ? "Back to chat" : "Back to menu"}
                onClick={() => { if (activeThread) setActiveThread(null); else setMobileShowSidebar(true); }}
                className={clsx("mr-2 sm:mr-3 p-1.5 sm:p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors flex-shrink-0", !activeThread && "md:hidden")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold leading-tight truncate">
                {activeThread ? 'Thread' : view === 'feed' ? 'Public Feed' : `Chat with ${activeChat}`}
              </h2>
            </div>
          </div>
          
          <div className="relative w-28 sm:w-44 md:w-64 flex-shrink-0">
            <Search className="absolute left-2.5 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                if (e.target.value) setView('global_search');
                else if (view === 'global_search') setView(activeChat ? 'chat' : 'feed');
              }}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-8 sm:pl-9 pr-3 py-1 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-xs sm:text-sm placeholder:truncate"
            />
          </div>
        </header>
        
        {view === 'chat' && typingUsers.length > 0 && (
          <div className="bg-neutral-800/80 border-b border-white/5 px-4 py-1.5 flex items-center space-x-2 shadow-sm z-10 shrink-0">
            <div className="flex -space-x-1">
              {typingUsers.slice(0, 3).map((u, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-neutral-900 bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-medium text-white">{u.username.charAt(0).toUpperCase()}</span>
                  )}
                  {u.color && (
                     <div className="absolute inset-0 opacity-20" style={{ backgroundColor: u.color }}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-neutral-400 ml-1">
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        {/* Pinned Messages Banner */}
        {view === 'chat' && !activeThread && messages.filter((m: any) => !m.parentId && m.isPinned).length > 0 && (
          <div className="flex-shrink-0 bg-neutral-900 border-b border-white/10 p-2 md:px-6 sticky top-0 z-10 shadow-md">
            <div className="flex space-x-2 overflow-x-auto overflow-y-hidden pb-2 flex-nowrap custom-scrollbar touch-pan-x" role="region" aria-label="Pinned Messages" tabIndex={0}>
              {messages.filter((m: any) => !m.parentId && m.isPinned).map((msg: any) => (
                <div key={msg.id} tabIndex={0} aria-label={`View pinned message from ${msg.senderUsername}`} onKeyDown={(e) => { if (e.key === 'Enter') { const el = document.getElementById(`msg-${msg.id}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950', 'transition-all'); setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950'), 2000); } } }} className="flex flex-col bg-neutral-800/50 rounded-lg p-2 w-[160px] md:w-[210px] flex-none border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors group relative focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => {
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

        {/* Pinned Posts Banner */}
        {view === 'feed' && posts.filter((p: any) => p.isPinned).length > 0 && (
          <div className="flex-shrink-0 bg-neutral-900 border-b border-white/10 p-2 md:px-6 sticky top-0 z-10 shadow-md">
            <div className="flex space-x-2 overflow-x-auto overflow-y-hidden pb-2 flex-nowrap custom-scrollbar touch-pan-x" role="region" aria-label="Pinned Posts" tabIndex={0}>
              {posts.filter((p: any) => p.isPinned).map((post: any) => (
                <div key={post.id} tabIndex={0} aria-label={`View pinned post from ${post.username}`} onKeyDown={(e) => { if (e.key === 'Enter') { const el = document.getElementById(`post-${post.id}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950', 'transition-all'); setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950'), 2000); } } }} className="flex flex-col bg-neutral-800/50 rounded-lg p-2 w-[160px] md:w-[210px] flex-none border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors group relative focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => {
                  const el = document.getElementById(`post-${post.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950', 'transition-all');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-neutral-950'), 2000);
                  }
                }}>
                  <button 
                    className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-md transition-all text-neutral-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); togglePostPin(post.id); }}
                    title="Unpin"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center space-x-1 text-blue-400 mb-1">
                    <Pin className="w-3 h-3 fill-current rotate-45" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Pinned by {post.username}</span>
                  </div>
                  <div className="text-xs text-neutral-300 truncate">
                    {post.content || (post.fileName ? `File: ${post.fileName}` : 'Pinned post')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Area */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <PullToRefresh 
            className={clsx("px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 space-y-6", (view === 'chat' || activeThread) ? "pb-0" : "pb-6")} 
            scrollRef={scrollContainerRef}
            onClick={() => setActiveMenuMsg(null)} 
            onScroll={handleScroll}
            onRefresh={async () => {
              if (view === 'feed') await fetchApi('/api/posts').then(setPosts);
              else if (view === 'chat' && activeChat) await fetchApi(`/api/messages/${activeChat}`).then(setMessages);
            }}
          >
          <AnimatePresence mode="wait">
          {view === 'global_search' ? (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col space-y-6 max-w-2xl mx-auto w-full">
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
            </motion.div>
          ) : view === 'feed' ? (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-2xl mx-auto w-full">
              {(() => {
                const parseTime = (dateStr: any) => {
                  if (!dateStr) return 0;
                  if (typeof dateStr === 'number') return dateStr;
                  if (dateStr instanceof Date) return dateStr.getTime();
                  const str = String(dateStr).trim();
                  const normalized = str.replace(' ', 'T');
                  const iso = (!normalized.includes('Z') && !normalized.includes('+')) ? normalized + 'Z' : normalized;
                  const time = new Date(iso).getTime();
                  return isNaN(time) ? 0 : time;
                };

                const sortedPosts = [...posts].sort((a, b) => {
                  const timeA = parseTime(a.createdAt);
                  const timeB = parseTime(b.createdAt);
                  if (timeA !== timeB) return timeA - timeB;
                  return (a.id || '').localeCompare(b.id || '');
                });

                return sortedPosts.map((post) => (
                  <DissolvingItem 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={post.id} 
                    expiresAt={post.expiresAt}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveReactionMenuId(activeReactionMenuId === post.id ? null : post.id);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      const defaultEmoji = getCustomReactions()[0] || '😀';
                      togglePostReaction(post.id, defaultEmoji);
                    }}
                    onTouchStart={(e) => {
                      if (e.touches.length > 0) {
                        touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                      }
                      msgLongPressTimerRef.current = setTimeout(() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                          try { navigator.vibrate(30); } catch(e){}
                        }
                        setActiveReactionMenuId(post.id);
                        msgLongPressTimerRef.current = null;
                      }, 500);
                    }}
                    onTouchEnd={() => {
                      if (msgLongPressTimerRef.current) {
                        clearTimeout(msgLongPressTimerRef.current);
                        msgLongPressTimerRef.current = null;
                      }
                    }}
                    onTouchMove={(e) => {
                      if (msgLongPressTimerRef.current && e.touches.length > 0) {
                        const dx = e.touches[0].clientX - touchStartPosRef.current.x;
                        const dy = e.touches[0].clientY - touchStartPosRef.current.y;
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                          clearTimeout(msgLongPressTimerRef.current);
                          msgLongPressTimerRef.current = null;
                        }
                      }
                    }}
                    id={`post-${post.id}`}
                    className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-xl relative group select-none cursor-pointer transition-all"
                    style={{ position: 'relative' }}
                  >
                    {/* Reaction Particle Burst Animation */}
                    {activeReactionAnimation?.id === post.id && (
                      <AnimatePresence>
                        <motion.div
                          key={activeReactionAnimation.key}
                          initial={{ opacity: 1, scale: 0.5, y: 0 }}
                          animate={{ opacity: 0, scale: 2.2, y: -65 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.75, ease: "easeOut" }}
                          className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl pointer-events-none z-50 select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                        >
                          {activeReactionAnimation.emoji}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    <div className="flex items-center justify-between mb-4 pr-8">
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
                      
                      {/* Top-right actions (Pin and Delete) */}
                      <div className="flex items-center space-x-1" style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 20 }}>
                        <button
                          aria-label={post.isPinned ? "Unpin post" : "Pin post"}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePostPin(post.id);
                          }}
                          className={clsx(
                            "p-1 border border-white/10 rounded-full shadow-md transition-all flex items-center justify-center hover:scale-110 active:scale-95",
                            post.isPinned 
                              ? "bg-blue-600/80 hover:bg-blue-600 text-white" 
                              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                          )}
                          title={post.isPinned ? "Unpin post" : "Pin post"}
                        >
                          {post.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        {post.username === session?.username && (
<button 
                          aria-label="Delete post"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePost(post.id);
                          }}
                          className="p-1 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white border border-white/10 rounded-full shadow-md transition-all flex items-center justify-center hover:scale-110 active:scale-95"
                          title="Delete post"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
)}
                      </div>
                    </div>

                    {/* Original post text remains visible */}
                    {post.content && (
                      <p className="text-neutral-200 text-[15px] leading-relaxed mb-2 whitespace-pre-wrap break-words [word-break:break-word]">
                        {post.content}
                        {post.isEdited === 1 && <span className="text-[10px] opacity-60 ml-2">(edited)</span>}
                        {!!post.isPinned && <span className="text-[10px] ml-2 inline-flex items-center text-blue-400"><Pin className="w-2.5 h-2.5 mr-0.5" fill="currentColor" /></span>}
                      </p>
                    )}
                    {post.folderFiles && post.folderName && (
                      <FolderAttachmentView
                        messageId={post.id}
                        folderName={post.folderName}
                        folderFiles={post.folderFiles}
                        isPost={true}
                        onPreviewFile={(f) => setViewingFile({ url: f.url, type: f.type, name: f.name, downloadUrl: f.downloadUrl })}
                      />
                    )}
                    {post.fileUrl && !post.folderFiles && (
                      <FileAttachmentView
                        fileUrl={post.fileUrl}
                        fileName={post.fileName}
                        fileType={post.fileType}
                        fileSize={post.fileSize}
                        onPreview={() => setViewingFile({ url: post.fileUrl, type: post.fileType, name: post.fileName })}
                        className="mb-3"
                      />
                    )}
                    {!!post.isPinned && (
                      <div className="flex items-center space-x-1 mt-2 mb-2 opacity-80 text-blue-400">
                        <Pin className="w-2.5 h-2.5" fill="currentColor" />
                        <span className="text-[9px] font-medium tracking-wider uppercase">Pinned</span>
                      </div>
                    )}

                    {/* Separate Editable Input Field */}
                    {editingMessageId === post.id && (
                      <div className="mt-2 mb-3 p-2.5 bg-neutral-950 border border-white/15 rounded-xl space-y-2 w-full shadow-xl text-left">
                        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Edit Post
                        </div>
                        <textarea
                          value={editMessageContent}
                          onChange={(e) => setEditMessageContent(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(post.id);
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditMessageContent('');
                            }
                          }}
                          className="w-full p-2 text-sm bg-neutral-900 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditMessageContent('');
                            }}
                            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(post.id)}
                            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-md font-medium transition-colors shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reaction Bubble Pills */}
                    <ReactionBubblePill
                      reactions={post.reactions || []}
                      currentUsername={session.username}
                      onToggleEmoji={(emoji) => togglePostReaction(post.id, emoji)}
                      onOpenUsersModal={() => setActiveReactedUsersItem({ id: post.id, reactions: post.reactions || [], isPost: true })}
                    />

                    {/* Actions Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 w-full relative">
                      {/* Floating Reaction Picker Popup */}
                      <ReactionPickerPopup
                        isOpen={activeReactionMenuId === post.id}
                        onSelectEmoji={(emoji) => togglePostReaction(post.id, emoji)}
                        onClose={() => setActiveReactionMenuId(null)}
                        align="left"
                        onPin={() => togglePostPin(post.id)}
                        isPinned={!!post.isPinned}
                      />

                      <div className="flex items-center space-x-2 ml-auto">
                      <button 
                        aria-label="Copy post text"
                        onClick={() => copyMessage(post.id, post.content || post.fileName || '')}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/5 bg-neutral-950/60 shadow-sm"
                        title="Copy post text"
                      >
                        {copiedMessageId === post.id ? (
                          <Check className="w-3 h-3 text-green-400 transition-all scale-110" />
                        ) : (
                          <Copy className="w-3 h-3 transition-all" />
                        )}
                        <span>Copy</span>
                      </button>
                      {post.username === session?.username && (
<button 
                        aria-label="Edit post"
                        onClick={() => startEditing(post)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/5 bg-neutral-950/60 shadow-sm"
                        title="Edit post"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
)}
                    </div>
                  </div>
                </DissolvingItem>
                ));
              })()}
              {posts.length === 0 && (
                <div className="text-center text-neutral-500 py-12">No posts yet. Be the first to share!</div>
              )}
            </motion.div>
          ) : (
            <motion.div key={activeThread ? `thread-${activeThread.id}` : `chat-${activeChat}`} data-messages-list="true" initial={{ opacity: 0, x: activeThread ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: activeThread ? -20 : 20 }} transition={{ duration: 0.2 }} className="flex flex-col justify-end min-h-full space-y-4 max-w-3xl mx-auto w-full pb-4 pt-4">
              {(() => {
                const parseTime = (dateStr: any) => {
                  if (!dateStr) return 0;
                  if (typeof dateStr === 'number') return dateStr;
                  if (dateStr instanceof Date) return dateStr.getTime();
                  const normalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : String(dateStr);
                  const iso = typeof normalized === 'string' && !normalized.includes('Z') && !normalized.includes('+') ? normalized + 'Z' : normalized;
                  const time = new Date(iso).getTime();
                  return isNaN(time) ? 0 : time;
                };

                const rawMessages = messages.filter((msg: any) => !msg.parentId && (chatSearchQuery === '' || msg.content?.toLowerCase().includes(chatSearchQuery.toLowerCase()) || msg.fileName?.toLowerCase().includes(chatSearchQuery.toLowerCase())));

                const threadReplies = activeThread
                  ? messages
                      .filter((m: any) => m.parentId === activeThread.id)
                      .sort((a: any, b: any) => {
                        const timeA = parseTime(a.createdAt);
                        const timeB = parseTime(b.createdAt);
                        if (timeA !== timeB) return timeA - timeB;
                        return (a.id || '').localeCompare(b.id || '');
                      })
                  : [];

                const displayedMessages = activeThread
                  ? [activeThread, ...threadReplies]
                  : [...rawMessages].sort((a: any, b: any) => {
                      const timeA = parseTime(a.createdAt);
                      const timeB = parseTime(b.createdAt);
                      if (timeA !== timeB) return timeA - timeB;
                      return (a.id || '').localeCompare(b.id || '');
                    });

                return displayedMessages.map((msg: any, index: number) => {
                const isLast = index === displayedMessages.length - 1;
                const isMe = msg.senderUsername === session.username;
                const isThreadParent = activeThread?.id === msg.id;
                const replyCount = messages.filter((m: any) => m.parentId === msg.id).length;
                const parentMsg = msg.parentId ? messages.find((m: any) => m.id === msg.parentId) : null;
                
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
                    data-last-message={isLast ? "true" : undefined}
                    expiresAt={msg.expiresAt}
                    initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={clsx(
                      "flex flex-col max-w-[80%] group relative transition-all duration-200",
                      isMe ? "self-end items-end" : "self-start items-start",
                      activeReactionMenuId === msg.id && "z-50 scale-[1.03]"
                    )}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuMsg(activeMenuMsg === msg.id ? null : msg.id);
                    }}
                  >
                    <div className="relative w-full overflow-visible">
                      {/* Swipe to reply indicator */}
                      <div 
                        id={`reply-icon-${msg.id}`}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 pointer-events-none transition-all flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border border-white/20"
                      >
                        <Reply className="w-4 h-4" />
                      </div>

                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 100 }}
                        dragElastic={0.25}
                        dragSnapToOrigin={true}
                        onDrag={(_, info) => {
                          const replyIcon = document.getElementById(`reply-icon-${msg.id}`);
                          if (replyIcon) {
                            if (info.offset.x > 15) {
                              replyIcon.style.opacity = Math.min(1, (info.offset.x - 15) / 45).toString();
                              replyIcon.style.transform = `translateY(-50%) scale(${Math.min(1.2, 0.7 + info.offset.x / 80)})`;
                            } else {
                              replyIcon.style.opacity = '0';
                            }
                          }
                        }}
                        onDragEnd={(_, info) => {
                          const replyIcon = document.getElementById(`reply-icon-${msg.id}`);
                          if (replyIcon) {
                            replyIcon.style.opacity = '0';
                          }
                          if (info.offset.x > 50 || info.velocity.x > 250) {
                            setReplyToMessage(msg);
                          }
                        }}
                        className={clsx("flex items-end space-x-2 relative pt-2 touch-pan-y", isMe && "flex-row-reverse space-x-reverse")}
                      >
                        <div 
                          onTouchStart={(e) => {
                            if (e.touches.length > 0) {
                              touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                            }
                            msgLongPressTimerRef.current = setTimeout(() => {
                              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                try { navigator.vibrate(35); } catch(e){}
                              }
                              setActiveReactionMenuId(msg.id);
                              msgLongPressTimerRef.current = null;
                            }, 500);
                          }}
                          onTouchEnd={() => {
                            if (msgLongPressTimerRef.current) {
                              clearTimeout(msgLongPressTimerRef.current);
                              msgLongPressTimerRef.current = null;
                            }
                          }}
                          onTouchMove={(e) => {
                            if (msgLongPressTimerRef.current && e.touches.length > 0) {
                              const dx = e.touches[0].clientX - touchStartPosRef.current.x;
                              const dy = e.touches[0].clientY - touchStartPosRef.current.y;
                              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                clearTimeout(msgLongPressTimerRef.current);
                                msgLongPressTimerRef.current = null;
                              }
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setActiveReactionMenuId(activeReactionMenuId === msg.id ? null : msg.id);
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            const defaultEmoji = getCustomReactions()[0] || '😀';
                            toggleMessageReaction(msg.id, defaultEmoji);
                          }}
                          className={clsx(
                            "pl-4 py-2.5 min-h-[44px] rounded-2xl text-[15px] relative transition-all group/bubble select-none cursor-pointer", 
                            editingMessageId !== msg.id && "active:scale-[0.98]",
                            isMe ? "bg-white text-black rounded-br-sm pr-[54px]" : "bg-neutral-800 text-white rounded-bl-sm pr-[32px]",
                            activeReactionMenuId === msg.id && "ring-2 ring-blue-500/80 shadow-2xl scale-[1.03]"
                          )}
                          style={{ position: 'relative' }}
                        >
                          {/* Reaction Particle Burst Animation */}
                          {activeReactionAnimation?.id === msg.id && (
                            <AnimatePresence>
                              <motion.div
                                key={activeReactionAnimation.key}
                                initial={{ opacity: 1, scale: 0.5, y: 0 }}
                                animate={{ opacity: 0, scale: 2.2, y: -65 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.75, ease: "easeOut" }}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl pointer-events-none z-50 select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                              >
                                {activeReactionAnimation.emoji}
                              </motion.div>
                            </AnimatePresence>
                          )}

                          {/* Reaction Picker Popup */}
                          <ReactionPickerPopup
                            isOpen={activeReactionMenuId === msg.id}
                            onSelectEmoji={(emoji) => toggleMessageReaction(msg.id, emoji)}
                            onClose={() => setActiveReactionMenuId(null)}
                            isMe={isMe}
                            isPinned={!!msg.isPinned}
                            onPin={() => togglePin(msg.id)}
                          />

                          {/* Top-right actions (Pin and Delete) */}
                          <div className="flex items-center space-x-1" style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 20 }}>
                            <button
                              aria-label={msg.isPinned ? "Unpin message" : "Pin message"}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(msg.id);
                              }}
                              className={clsx(
                                "p-1 border border-white/10 rounded-full shadow-md transition-all flex items-center justify-center hover:scale-110 active:scale-95",
                                msg.isPinned 
                                  ? "bg-blue-600/80 hover:bg-blue-600 text-white" 
                                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                              )}
                              title={msg.isPinned ? "Unpin message" : "Pin message"}
                            >
                              {msg.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            </button>
                            {isMe && (
<button
                              aria-label="Delete message"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(msg.id);
                              }}
                              className="p-1 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white border border-white/10 rounded-full shadow-md transition-all flex items-center justify-center hover:scale-110 active:scale-95"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
)}
                          </div>

                          {/* Quote preview of Parent Message if replied */}
                          {parentMsg && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                const parentEl = document.getElementById(`msg-${parentMsg.id}`);
                                if (parentEl) {
                                  parentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  parentEl.classList.add('ring-2', 'ring-blue-500', 'transition-all');
                                  setTimeout(() => parentEl.classList.remove('ring-2', 'ring-blue-500'), 1500);
                                }
                              }}
                              className={clsx(
                                "mb-2 p-2 rounded-xl text-xs cursor-pointer border-l-3 transition-all hover:brightness-110 select-none text-left",
                                isMe ? "bg-black/15 border-blue-600 text-neutral-800" : "bg-white/10 border-blue-400 text-neutral-200"
                              )}
                            >
                              <div className="font-semibold text-[11px] text-blue-400 flex items-center space-x-1 mb-0.5">
                                <Reply className="w-3 h-3" />
                                <span>@{parentMsg.senderUsername}</span>
                              </div>
                              <div className="truncate opacity-80 text-[11px] font-normal">
                                {parentMsg.content || (parentMsg.folderName ? `Folder: ${parentMsg.folderName}` : (parentMsg.fileName || (parentMsg.fileUrl ? 'Media attachment' : 'Message')))}
                              </div>
                            </div>
                          )}

                          {/* Original message content remains visible */}
                          {msg.content && (
                            <div className="whitespace-pre-wrap break-words [word-break:break-word]">
                              {highlightText(msg.content, chatSearchQuery)}
                              {msg.isEdited === 1 && <span className="text-[10px] opacity-60 ml-2">(edited)</span>}
                            </div>
                          )}
                          {msg.folderFiles && msg.folderName && (
                            <FolderAttachmentView
                              messageId={msg.id}
                              folderName={msg.folderName}
                              folderFiles={msg.folderFiles}
                              isPost={false}
                              onPreviewFile={(f) => setViewingFile({ url: f.url, type: f.type, name: f.name, downloadUrl: f.downloadUrl })}
                            />
                          )}
                          {msg.fileUrl && !msg.folderFiles && (
                            <FileAttachmentView
                              fileUrl={msg.fileUrl}
                              fileName={msg.fileName}
                              fileType={msg.fileType}
                              fileSize={msg.fileSize}
                              onPreview={() => setViewingFile({ url: msg.fileUrl, type: msg.fileType, name: msg.fileName })}
                            />
                          )}
                          {!!msg.isPinned && (
                            <div className={clsx("flex items-center space-x-1 mt-1 opacity-80", isMe ? "justify-end text-blue-600" : "justify-start text-blue-400")}>
                              <Pin className="w-2.5 h-2.5" fill="currentColor" />
                              <span className="text-[9px] font-medium tracking-wider uppercase">Pinned</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action trigger button beside message on hover / tap */}
                        <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 z-20", isMe ? "right-full mr-1.5" : "left-full ml-1.5")}>
                          <button 
                            aria-label="Reply to message"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyToMessage(msg);
                            }}
                            className="p-1.5 rounded-full text-neutral-400 hover:text-blue-400 hover:bg-white/10 transition-colors"
                            title="Reply"
                          >
                            <Reply className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </motion.div>
                    </div>

                    {/* Reaction Bubble Pills below message */}
                    <ReactionBubblePill
                      reactions={msg.reactions || []}
                      currentUsername={session.username}
                      onToggleEmoji={(emoji) => toggleMessageReaction(msg.id, emoji)}
                      onOpenUsersModal={() => setActiveReactedUsersItem({ id: msg.id, reactions: msg.reactions || [], isPost: false })}
                      isMe={isMe}
                    />

                    {/* Separate Editable Input Field (rendered while preserving original message) */}
                    {editingMessageId === msg.id && (
                      <div className="mt-2 p-2.5 bg-neutral-900 border border-white/15 rounded-xl space-y-2 w-full max-w-md shadow-xl text-left z-10">
                        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Edit Message
                        </div>
                        <textarea
                          value={editMessageContent}
                          onChange={(e) => setEditMessageContent(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(msg.id);
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditMessageContent('');
                            }
                          }}
                          className="w-full p-2 text-sm bg-neutral-950 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditMessageContent('');
                            }}
                            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(msg.id)}
                            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-md font-medium transition-colors shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Persistent Actions (Copy & Edit) right-aligned in bottom-right corner below message */}
                    <div className="flex items-center justify-end space-x-2 mt-1.5 px-1 w-full">
                      <button 
                        aria-label="Copy message text"
                        onClick={() => copyMessage(msg.id, msg.content || msg.fileName || '')}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/5 bg-neutral-900/60 shadow-sm"
                        title="Copy message text"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-green-400 transition-all scale-110" />
                        ) : (
                          <Copy className="w-3 h-3 transition-all" />
                        )}
                        <span>Copy</span>
                      </button>
                      {isMe && (
<button 
                        aria-label="Edit message"
                        onClick={() => startEditing(msg)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/5 bg-neutral-900/60 shadow-sm"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
)}
                    </div>

                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center space-x-1.5">
                      {!!msg.isPinned && (
                        <div className="flex items-center text-blue-400" title="Pinned message">
                          <Pin className="w-3 h-3 fill-current rotate-45" />
                        </div>
                      )}
                      <span>{format(new Date(msg.createdAt.replace(' ', 'T') + (!msg.createdAt.endsWith('Z') ? 'Z' : '')), 'h:mm a').toLowerCase()}</span>
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
                                title={msg.seenAt ? `Read at ${format(new Date(msg.seenAt), 'h:mm:ss a').toLowerCase()}` : 'Read'}
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
              <div ref={messagesEndRef} className="h-0 w-full pointer-events-none flex-shrink-0" />
            </motion.div>
          )}
          </AnimatePresence>
        </PullToRefresh>

        {/* Floating WhatsApp-style New Messages / Scroll to Bottom Indicator */}
        <AnimatePresence>
          {view === 'chat' && (!isAtBottom || unreadCount > 0) && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              onClick={() => scrollToBottom(true)}
              className="absolute right-4 sm:right-6 bottom-4 z-30 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-full shadow-2xl border border-white/20 flex items-center space-x-2 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <ChevronDown className="w-4 h-4 animate-bounce" />
              <span>{unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Latest messages'}</span>
            </motion.button>
          )}
        </AnimatePresence>
        </div>
        {/* Composer Footer */}
        {view !== 'global_search' && (
        <div data-composer="true" id="chat-composer" className="chat-composer-container w-full flex-shrink-0 p-2 md:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-4 bg-neutral-950 border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-20 min-w-0">
          <div className="max-w-3xl mx-auto relative w-full min-w-0">
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
              replyToMessage={replyToMessage}
              setReplyToMessage={setReplyToMessage}
              session={session}
              file={file}
              setFile={setFile}
              openCustomCamera={openCustomCamera}
              handleMicClick={handleMicClick}
              setToastMessage={setToastMessage}
              onMessageSent={() => scrollToBottom(true)}
            />
          </div>
        </div>
      )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {viewingFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
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
                      href={viewingFile.downloadUrl || `/api/proxy-download?url=${encodeURIComponent(viewingFile.url)}&filename=${encodeURIComponent(viewingFile.name)}${localStorage.getItem('sessionId') ? `&sessionId=${localStorage.getItem('sessionId')}` : ''}`} 
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
                    <iframe onLoad={() => setIsPreviewLoading(false)} src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingFile.url)}&embedded=true`} className="w-full h-full rounded border-0 bg-white" title={viewingFile.name} />
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
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {showClearStorageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowClearStorageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 text-red-400">
                <div className="p-2.5 bg-red-500/10 rounded-full border border-red-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Clear All Storage</h3>
                  <p className="text-xs text-neutral-400">Free up space immediately</p>
                </div>
              </div>
              <div className="bg-neutral-950 p-3 rounded-xl border border-white/5 space-y-1">
                <div className="text-xs text-neutral-400 flex justify-between">
                  <span>Current Space Used:</span>
                  <span className="text-white font-medium">{formatStorageDisplay(storageUsage?.usageBytes || 0, storageUsage?.limitBytes)}</span>
                </div>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Are you sure you want to clear storage? This will permanently delete all uploaded files, media attachments, public posts, and messages.
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearStorageModal(false)}
                  className="px-4 py-2 text-sm text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowClearStorageModal(false);
                    try {
                      setStorageUsage({ usageBytes: 0, limitBytes: 25 * 1024 * 1024 * 1024, categories: { images: 0, videos: 0, audio: 0, documents: 0, others: 0 } });
                      setPosts([]);
                      setChats([]);
                      setMessages([]);
                      setActiveChat(null);
                      await fetchApi('/api/storage/clear', { method: 'POST' });
                      setToastMessage('Storage cleared successfully!');
                      setTimeout(() => setToastMessage(null), 3000);
                    } catch (err) {
                      console.error('Failed to clear storage:', err);
                      setToastMessage('Failed to clear storage');
                      setTimeout(() => setToastMessage(null), 3000);
                    }
                  }}
                  className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20 flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Storage</span>
                </button>
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

      <ReactedUsersModal
        isOpen={!!activeReactedUsersItem}
        onClose={() => setActiveReactedUsersItem(null)}
        reactions={
          activeReactedUsersItem
            ? (activeReactedUsersItem.isPost
                ? posts.find(p => p.id === activeReactedUsersItem.id)?.reactions
                : messages.find(m => m.id === activeReactedUsersItem.id)?.reactions) || []
            : []
        }
        currentUsername={session.username}
        onRemoveReaction={(emoji) => {
          if (!activeReactedUsersItem) return;
          if (activeReactedUsersItem.isPost) {
            togglePostReaction(activeReactedUsersItem.id, emoji);
          } else {
            toggleMessageReaction(activeReactedUsersItem.id, emoji);
          }
        }}
      />
    </div>
    </>
  );
}
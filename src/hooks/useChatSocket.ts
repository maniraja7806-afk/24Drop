import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { fetchApi } from '../lib/api';

interface UseChatSocketProps {
  session: any;
  activeChat: string | null;
  view: string;
  setPosts: React.Dispatch<React.SetStateAction<any[]>>;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setToastMessage: (msg: string | null) => void;
  setStorageUsage: (data: any) => void;
  fetchChats: () => void;
  scrollToBottom: (smooth?: boolean) => void;
}

export const useChatSocket = ({
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
}: UseChatSocketProps) => {

  // Storage
  useEffect(() => {
    const handleStorageUpdated = (data: any) => {
      if (data) {
        setStorageUsage(data);
      }
    };
    socket.on('storage_updated', handleStorageUpdated);
    const interval = setInterval(() => {
      fetchApi('/api/storage/usage').then(setStorageUsage).catch(() => {});
    }, 30000); // refresh every 30s as backup
    
    return () => {
      socket.off('storage_updated', handleStorageUpdated);
      clearInterval(interval);
    };
  }, [setStorageUsage]);

  // Global new message
  useEffect(() => {
    const handleGlobalNewMessage = (msg: any) => {
      fetchChats();
    };
    socket.on("new_message", handleGlobalNewMessage);
    return () => {
      socket.off("new_message", handleGlobalNewMessage);
    };
  }, [fetchChats]);

  // Posts
  useEffect(() => {
    fetchApi("/api/posts").then(setPosts).catch(console.error);

    const handleNewPost = (post: any) => setPosts((p) => {
      if (p.find((x) => x.id === post.id)) return p;
      return [...p, post];
    });
    
    const handleDeletePost = (id: string) => setPosts((p) => {
      if (!p.some((x) => x.id === id)) return p;
      return p.filter((x) => x.id !== id);
    });
    
    const handleEditPost = ({ postId, content }: any) => setPosts((p) => {
      if (!p.some((x) => x.id === postId)) return p;
      return p.map((x) => x.id === postId ? { ...x, content } : x);
    });
    
    const handlePostPinned = ({ postId, isPinned, replaced }: any) => {
      setPosts((p) => {
        if (!p.some((x) => x.id === postId)) return p;
        return p.map((x) => x.id === postId ? { ...x, isPinned } : x);
      });
      if (replaced) {
        setToastMessage("📌 Oldest pinned message replaced.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    };
    
    const handlePostReaction = ({ postId, username, emoji, removed }: any) => {
      setPosts((p) => {
        if (!p.some((post) => post.id === postId)) return p;
        return p.map((post) => {
          if (post.id !== postId) return post;
          const reactions = post.reactions || [];
          if (removed) {
            return { ...post, reactions: reactions.filter((r: any) => !(r.username === username && r.emoji === emoji)) };
          } else {
            const cleaned = reactions.filter((r: any) => r.username !== username);
            return { ...post, reactions: [...cleaned, { username, emoji }] };
          }
        });
      });
    };

    socket.on("new_post", handleNewPost);
    socket.on("delete_post", handleDeletePost);
    socket.on("edit_post", handleEditPost);
    socket.on("post_pinned", handlePostPinned);
    socket.on("post_reaction", handlePostReaction);

    return () => {
      socket.off("new_post", handleNewPost);
      socket.off("delete_post", handleDeletePost);
      socket.off("edit_post", handleEditPost);
      socket.off("post_pinned", handlePostPinned);
      socket.off("post_reaction", handlePostReaction);
    };
  }, [setPosts, setToastMessage]);

  // Messages
  useEffect(() => {
    if (!activeChat) return;

    const loadMessages = () => {
      fetchApi(`/api/messages/${activeChat}`)
        .then((data) => {
          setMessages(data);
          scrollToBottom(false);
          setTimeout(() => scrollToBottom(false), 60);
          setTimeout(() => scrollToBottom(false), 200);
        })
        .catch(console.error);
    };

    loadMessages();

    const handleSocketReconnect = () => {
      loadMessages();
    };

    const handleNewMessage = (msg: any) => {
      console.log('Received new_message:', msg, 'activeChat:', activeChat);
      const recipient = msg.recipientUsername || msg.receiverUsername;
      if (msg.senderUsername === activeChat || recipient === activeChat) {
        setMessages((m) => {
          if (m.find((x) => x.id === msg.id)) return m;
          return [...m, msg];
        });
      }
    };

    const handleReaction = ({ messageId, username, emoji, removed }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = msg.reactions || [];
          if (removed) {
            return { ...msg, reactions: reactions.filter((r: any) => !(r.username === username && r.emoji === emoji)) };
          } else {
            const cleaned = reactions.filter((r: any) => r.username !== username);
            return { ...msg, reactions: [...cleaned, { username, emoji }] };
          }
        });
      });
    };
    
    const handleMessagesSeen = ({ by, seenAt }: any) => {
      setMessages((m) => {
        const hasUnseen = m.some(msg => msg.senderUsername === session.username && msg.receiverUsername === by && msg.status !== 'seen');
        if (!hasUnseen) return m;
        return m.map(msg => {
          if (msg.senderUsername === session.username && msg.receiverUsername === by && msg.status !== 'seen') {
            return { ...msg, status: 'seen', seenAt };
          }
          return msg;
        });
      });
    };
    
    const handleStatusUpdate = ({ messageId, status }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => msg.id === messageId ? { ...msg, status } : msg);
      });
    };

    const handleMessagePinned = ({ messageId, isPinned, replaced }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => msg.id === messageId ? { ...msg, isPinned } : msg);
      });
      if (replaced) {
        setToastMessage("📌 Oldest pinned message replaced.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    };

    const handleEditMessage = ({ messageId, content }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => msg.id === messageId ? { ...msg, content, isEdited: 1 } : msg);
      });
    };

    const handleDeleteMessage = ({ messageId }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.filter((msg) => msg.id !== messageId);
      });
    };

    socket.on("connect", handleSocketReconnect);
    socket.on("reconnect", handleSocketReconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("message_reaction", handleReaction);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("message_status_update", handleStatusUpdate);
    socket.on("message_pinned", handleMessagePinned);
    socket.on("edit_message", handleEditMessage);
    socket.on("delete_message", handleDeleteMessage);
    
    return () => {
      socket.off("connect", handleSocketReconnect);
      socket.off("reconnect", handleSocketReconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("message_reaction", handleReaction);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("message_status_update", handleStatusUpdate);
      socket.off("message_pinned", handleMessagePinned);
      socket.off("edit_message", handleEditMessage);
      socket.off("delete_message", handleDeleteMessage);
    };
  }, [activeChat, session.username, setMessages, scrollToBottom, setToastMessage]);

  // Typing
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
      setTypingUsers((prev) => {
        if (!prev.some((u) => u.username === from)) return prev;
        return prev.filter((u) => u.username !== from);
      });
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [view, activeChat, setTypingUsers]);
};

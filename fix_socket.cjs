const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// fix delete_post
code = code.replace(
  /socket\.on\("delete_post", \(id\) => setPosts\(\(p\) => p\.filter\(\(x\) => x\.id !== id\)\)\);/,
  `socket.on("delete_post", (id) => setPosts((p) => {
      if (!p.some((x) => x.id === id)) return p;
      return p.filter((x) => x.id !== id);
    }));`
);

// fix edit_post
code = code.replace(
  /socket\.on\("edit_post", \(\{ postId, content \}\) => setPosts\(\(p\) => p\.map\(x => x\.id === postId \? \{ \.\.\.x, content \} : x\)\)\);/,
  `socket.on("edit_post", ({ postId, content }) => setPosts((p) => {
      if (!p.some((x) => x.id === postId)) return p;
      return p.map((x) => x.id === postId ? { ...x, content } : x);
    }));`
);

// fix post_pinned
code = code.replace(
  /socket\.on\("post_pinned", \(\{ postId, isPinned, replaced \}\) => \{\s*setPosts\(\(p\) => p\.map\(x => x\.id === postId \? \{ \.\.\.x, isPinned \} : x\)\);\s*if \(replaced\) \{\s*setToastMessage\("📌 Oldest pinned message replaced\."\);\s*setTimeout\(\(\) => setToastMessage\(null\), 3000\);\s*\}\s*\}\);/g,
  `socket.on("post_pinned", ({ postId, isPinned, replaced }) => {
      setPosts((p) => {
        if (!p.some((x) => x.id === postId)) return p;
        return p.map((x) => x.id === postId ? { ...x, isPinned } : x);
      });
      if (replaced) {
        setToastMessage("📌 Oldest pinned message replaced.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    });`
);

// fix post_reaction
code = code.replace(
  /socket\.on\("post_reaction", \(\{ postId, username, emoji, removed \}: any\) => \{\s*setPosts\(\(p\) =>\s*p\.map\(\(post\) => \{\s*if \(post\.id !== postId\) return post;\s*const reactions = post\.reactions \|\| \[\];\s*if \(removed\) \{\s*return \{ \.\.\.post, reactions: reactions\.filter\(\(r: any\) => !\(r\.username === username && r\.emoji === emoji\)\) \};\s*\} else \{\s*const cleaned = reactions\.filter\(\(r: any\) => r\.username !== username\);\s*return \{ \.\.\.post, reactions: \[\.\.\.cleaned, \{ username, emoji \}\] \};\s*\}\s*\}\)\s*\);\s*\}\);/g,
  `socket.on("post_reaction", ({ postId, username, emoji, removed }: any) => {
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
    });`
);

// fix handleReaction
code = code.replace(
  /const handleReaction = \(\{ messageId, username, emoji, removed \}: any\) => \{\s*setMessages\(\(m\) =>\s*m\.map\(\(msg\) => \{\s*if \(msg\.id !== messageId\) return msg;\s*const reactions = msg\.reactions \|\| \[\];\s*if \(removed\) \{\s*return \{ \.\.\.msg, reactions: reactions\.filter\(\(r: any\) => !\(r\.username === username && r\.emoji === emoji\)\) \};\s*\} else \{\s*const cleaned = reactions\.filter\(\(r: any\) => r\.username !== username\);\s*return \{ \.\.\.msg, reactions: \[\.\.\.cleaned, \{ username, emoji \}\] \};\s*\}\s*\}\)\s*\);\s*\};/g,
  `const handleReaction = ({ messageId, username, emoji, removed }: any) => {
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
    };`
);

// fix handleMessagesSeen
code = code.replace(
  /const handleMessagesSeen = \(\{ by, seenAt \}: any\) => \{\s*setMessages\(\(m\) => m\.map\(msg => \{\s*if \(msg\.senderUsername === session\.username && msg\.receiverUsername === by && msg\.status !== 'seen'\) \{\s*return \{ \.\.\.msg, status: 'seen', seenAt \};\s*\}\s*return msg;\s*\}\)\);\s*\};/g,
  `const handleMessagesSeen = ({ by, seenAt }: any) => {
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
    };`
);

// fix handleStatusUpdate
code = code.replace(
  /const handleStatusUpdate = \(\{ messageId, status \}: any\) => \{\s*setMessages\(\(m\) => m\.map\(msg => msg\.id === messageId \? \{ \.\.\.msg, status \} : msg\)\);\s*\};/g,
  `const handleStatusUpdate = ({ messageId, status }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => msg.id === messageId ? { ...msg, status } : msg);
      });
    };`
);

// fix handleMessagePinned
code = code.replace(
  /const handleMessagePinned = \(\{ messageId, isPinned, replaced \}: any\) => \{\s*setMessages\(\(m\) => m\.map\(msg => msg\.id === messageId \? \{ \.\.\.msg, isPinned \} : msg\)\);\s*if \(replaced\) \{\s*setToastMessage\("📌 Oldest pinned message replaced\."\);\s*setTimeout\(\(\) => setToastMessage\(null\), 3000\);\s*\}\s*\};/g,
  `const handleMessagePinned = ({ messageId, isPinned, replaced }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => msg.id === messageId ? { ...msg, isPinned } : msg);
      });
      if (replaced) {
        setToastMessage("📌 Oldest pinned message replaced.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    };`
);

// fix handleEditMessage
code = code.replace(
  /const handleEditMessage = \(\{ messageId, content \}: any\) => \{\s*setMessages\(\(m\) => m\.map\(msg => msg\.id === messageId \? \{ \.\.\.msg, content, isEdited: 1 \} : msg\)\);\s*\};/g,
  `const handleEditMessage = ({ messageId, content }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.map((msg) => msg.id === messageId ? { ...msg, content, isEdited: 1 } : msg);
      });
    };`
);

// fix handleDeleteMessage
code = code.replace(
  /const handleDeleteMessage = \(\{ messageId \}: any\) => \{\s*setMessages\(\(m\) => m\.filter\(msg => msg\.id !== messageId\)\);\s*\};/g,
  `const handleDeleteMessage = ({ messageId }: any) => {
      setMessages((m) => {
        if (!m.some((msg) => msg.id === messageId)) return m;
        return m.filter((msg) => msg.id !== messageId);
      });
    };`
);

fs.writeFileSync('src/components/MainApp.tsx', code);

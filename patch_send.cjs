const fs = require('fs');
let code = fs.readFileSync('src/components/Composer.tsx', 'utf-8');

const newHandleSend = `  const handleSend = async () => {
    if (!composerText.trim() && attachments.length === 0 && !driveFile) return;
    setIsSending(true);
    
    try {
      const sendRequest = async (formData: FormData) => {
        if (view === 'feed') {
          await fetchApi('/api/posts', { method: 'POST', body: formData });
        } else if (view === 'chat' && activeChat) {
          await fetchApi(\`/api/messages/\${activeChat}\`, { method: 'POST', body: formData });
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
  };`;

code = code.replace(/  const handleSend = async \(\) => \{[\s\S]*?    \} finally \{\n      setIsSending\(false\);\n    \}\n  \};/, newHandleSend);
fs.writeFileSync('src/components/Composer.tsx', code);

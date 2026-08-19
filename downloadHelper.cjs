const downloadCode = `
  const handleFolderDownload = (req, res, item) => {
    if (!item || !item.folderFiles) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    let files = [];
    try {
      files = JSON.parse(item.folderFiles);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid folder data' });
    }

    const archive = archiver('zip', {
      zlib: { level: 1 } // fast
    });

    res.attachment(\`\${item.folderName || 'Folder'}.zip\`);
    archive.pipe(res);

    const fetchAndAppend = (fileObj) => {
      return new Promise((resolve) => {
        const { name, fileUrl } = fileObj;
        if (!fileUrl) return resolve();

        if (fileUrl.startsWith('http')) {
          const client = fileUrl.startsWith('https') ? https : http;
          client.get(fileUrl, (response) => {
            if (response.statusCode === 200) {
              archive.append(response, { name });
              response.on('end', resolve);
              response.on('error', resolve);
            } else {
              resolve(); // Skip failed
            }
          }).on('error', resolve);
        } else {
          // Local file
          const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name });
          }
          resolve();
        }
      });
    };

    const processFiles = async () => {
      for (const f of files) {
        await fetchAndAppend(f);
      }
      archive.finalize();
    };

    processFiles();
  };

  app.get('/api/messages/:id/download-folder', requireSession, (req, res) => {
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.senderUsername !== req.session.username && msg.receiverUsername !== req.session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    handleFolderDownload(req, res, msg);
  });

  app.get('/api/posts/:id/download-folder', requireSession, (req, res) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    handleFolderDownload(req, res, post);
  });
`;
const fs = require('fs');
const serverContent = fs.readFileSync('server.ts', 'utf8');
const replacementStr = "  // Toggle Pin Message";
const newContent = serverContent.replace(replacementStr, downloadCode + "\n\n  // Toggle Pin Message");
fs.writeFileSync('server.ts', newContent);

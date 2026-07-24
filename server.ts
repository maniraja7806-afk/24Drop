import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Set up Database
  const dbPath = path.join(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL,
      avatar TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      username TEXT NOT NULL,
      color TEXT NOT NULL,
      avatar TEXT NOT NULL,
      content TEXT,
      parentId TEXT,
      fileUrl TEXT,
      fileName TEXT,
      fileType TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      FOREIGN KEY(sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderUsername TEXT NOT NULL,
      receiverUsername TEXT NOT NULL,
      content TEXT,
      parentId TEXT,
      fileUrl TEXT,
      fileName TEXT,
      fileType TEXT,
      status TEXT DEFAULT 'sent',
      isPinned BOOLEAN DEFAULT 0,
      seenAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      FOREIGN KEY(senderId) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS message_reactions (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE
    );
  `);
  
  // Migration for existing databases
  try {
    db.prepare('ALTER TABLE messages ADD COLUMN isPinned BOOLEAN DEFAULT 0').run();
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'");
  } catch(e) {}
  
  try {
    db.exec("ALTER TABLE messages ADD COLUMN seenAt DATETIME");
  } catch(e) {}

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.use('/uploads', express.static(uploadDir));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
  });
  const upload = multer({ 
    storage,
    limits: { fileSize: 25 * 1024 * 1024 * 1024 } // 25GB limit
  });

  // --- API Routes ---

  // Generate 3 random usernames
  app.get('/api/usernames/generate', (req, res) => {
    const adjectives = ['Blue', 'Nova', 'Pixel', 'Neon', 'Cyber', 'Quantum', 'Cosmic', 'Solar', 'Echo', 'Ghost'];
    const nouns = ['Falcon', 'Tiger', 'Wolf', 'Dragon', 'Phantom', 'Sphinx', 'Pulse', 'Viper', 'Rider', 'Nomad'];
    
    const generateName = () => {
      let name;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 100) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        name = `${adj}${noun}${num}`;
        const existing = db.prepare('SELECT id FROM sessions WHERE username = ?').get(name);
        if (!existing) isUnique = true;
        attempts++;
      }
      return name;
    };

    const usernames: string[] = [];
    while (usernames.length < 3) {
      const name = generateName();
      if (name && !usernames.includes(name)) {
        usernames.push(name);
      }
    }
    res.json({ usernames });
  });

  // Claim a username and create a 24-hour session
  app.post('/api/usernames/claim', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const checkStmt = db.prepare('SELECT * FROM sessions WHERE username = ?');
    const existing = checkStmt.get(username) as any;
    if (existing) {
      return res.json({ 
        sessionId: existing.id, 
        username: existing.username, 
        color: existing.color, 
        avatar: existing.avatar, 
        expiresAt: existing.expiresAt 
      });
    }

    const sessionId = uuidv4();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const avatars = ['🦊', '🐯', '🐺', '🦄', '🐲', '🐙', '🦖', '🦉'];
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    // Exactly 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const insertStmt = db.prepare('INSERT INTO sessions (id, username, color, avatar, expiresAt) VALUES (?, ?, ?, ?, ?)');
    insertStmt.run(sessionId, username, color, avatar, expiresAt);

    res.json({ sessionId, username, color, avatar, expiresAt });
  });

  // Session middleware
  const requireSession = (req: any, res: any, next: any) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) return res.status(401).json({ error: 'Missing session' });
    
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const session = stmt.get(sessionId);
    if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
    
    req.session = session;
    next();
  };

  // Get current session info
  app.get('/api/session', requireSession, (req: any, res: any) => {
    res.json(req.session);
  });
  
  // Storage usage
  app.get('/api/storage/usage', requireSession, async (req: any, res: any) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return res.json({ usageBytes: 0, limitBytes: 25 * 1024 * 1024 * 1024 });
      }
      const usage = await cloudinary.api.usage();
      // Cloudinary storage usage is in bytes, limits are in credits (1 credit = 1GB)
      const usageBytes = usage.storage.usage || 0;
      const limitBytes = 25 * 1024 * 1024 * 1024; // 25GB
      res.json({ usageBytes, limitBytes });
    } catch (err) {
      console.error('Failed to fetch cloudinary usage:', err);
      res.status(500).json({ error: 'Failed to fetch storage usage' });
    }
  });

  // Search users
  app.get('/api/users/search', requireSession, (req: any, res: any) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    const stmt = db.prepare("SELECT username, color, avatar, expiresAt FROM sessions WHERE username LIKE ? COLLATE NOCASE LIMIT 10");
    const users = stmt.all(`%${query}%`);
    console.log('Search query:', query, 'Result length:', users.length);
    res.json(users);
  });

  app.get('/api/chats', requireSession, (req: any, res: any) => {
    const session = req.session;
    
    // Get unique partners sorted by the latest message time
    const partners = db.prepare(`
      SELECT 
        CASE 
          WHEN m.senderUsername = ? THEN m.receiverUsername 
          ELSE m.senderUsername 
        END as username,
        MAX(m.createdAt) as lastMessageAt
      FROM messages m
      WHERE m.senderUsername = ? OR m.receiverUsername = ?
      GROUP BY username
      ORDER BY lastMessageAt DESC
      LIMIT 20
    `).all(session.username, session.username, session.username);
    
    // We can also fetch the color and avatar for these users
    const usernames = partners.map((p: any) => p.username);
    if (usernames.length === 0) {
      return res.json([]);
    }
    
    const placeholders = usernames.map(() => '?').join(',');
    const usersInfo = db.prepare(`SELECT username, color, avatar FROM sessions WHERE username IN (${placeholders})`).all(...usernames);
    
    const enrichedPartners = partners.map((p: any) => {
      const info = usersInfo.find((u: any) => u.username === p.username);
      return {
        ...p,
        color: info ? (info as any).color : 'bg-neutral-500',
        avatar: info ? (info as any).avatar : '👤'
      };
    });
    
    res.json(enrichedPartners);
  });

  app.get('/api/search', requireSession, (req: any, res: any) => {
    const query = req.query.q;
    const session = req.session;
    if (!query) return res.json({ posts: [], messages: [] });
    
    const posts = db.prepare("SELECT * FROM posts WHERE content LIKE ? COLLATE NOCASE OR fileName LIKE ? COLLATE NOCASE LIMIT 20").all(`%${query}%`, `%${query}%`);
    const messages = db.prepare("SELECT * FROM messages WHERE (senderUsername = ? OR receiverUsername = ?) AND (content LIKE ? COLLATE NOCASE OR fileName LIKE ? COLLATE NOCASE) LIMIT 20").all(session.username, session.username, `%${query}%`, `%${query}%`);
    
    res.json({ posts, messages });
  });

  // Get Posts
  app.get('/api/posts', requireSession, (req: any, res: any) => {
    const stmt = db.prepare('SELECT * FROM posts ORDER BY createdAt DESC LIMIT 100');
    const posts = stmt.all();
    res.json(posts);
  });

  // Create Post
  app.post('/api/posts', requireSession, upload.single('file'), async (req: any, res: any) => {
    const { content, parentId } = req.body;
    const file = req.file;
    const session = req.session;

    const driveFileUrl = req.body.driveFileUrl;
    const driveFileName = req.body.driveFileName;
    const driveFileType = req.body.driveFileType;

    if (!content && !file && !driveFileUrl) {
      return res.status(400).json({ error: 'Must provide content, file, or drive link' });
    }

    const postId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    let fileUrl = file ? `/uploads/${file.filename}` : (driveFileUrl || null);
    
    if (file && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(file.path, { resource_type: "auto", chunk_size: 20000000 }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        fileUrl = (result as any).secure_url;
        fs.unlinkSync(file.path);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(500).json({ error: `Cloudinary upload error: ${err.message || 'Unknown error'}` });
      }
    }

    const fileName = file ? file.originalname : (driveFileName || null);
    const fileType = file ? file.mimetype : (driveFileType || null);

    const stmt = db.prepare(`
      INSERT INTO posts (id, sessionId, username, color, avatar, content, parentId, fileUrl, fileName, fileType, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(postId, session.id, session.username, session.color, session.avatar, content || null, parentId || null, fileUrl, fileName, fileType, expiresAt);

    const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    
    // Broadcast via socket
    io.emit('new_post', newPost);
    
    res.json(newPost);
  });

  // Delete Post
  app.delete('/api/posts/:id', requireSession, (req: any, res: any) => {
    const postId = req.params.id;
    const session = req.session;

    const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
    const post: any = stmt.get(postId);

    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.sessionId !== session.id) return res.status(403).json({ error: 'Unauthorized' });

    // Optional: Delete file from fs
    if (post.fileUrl) {
      const filename = post.fileUrl.replace('/uploads/', '');
      const filepath = path.join(uploadDir, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }

    const delStmt = db.prepare('DELETE FROM posts WHERE id = ?');
    delStmt.run(postId);

    io.emit('delete_post', postId);
    res.json({ success: true });
  });

  // Get Messages
  app.get('/api/messages/:username', requireSession, (req: any, res: any) => {
    const otherUsername = req.params.username;
    const myUsername = req.session.username;

    const nowIso = new Date().toISOString();
    // Mark as seen
    db.prepare(`
      UPDATE messages SET status = 'seen', seenAt = ? 
      WHERE senderUsername = ? AND receiverUsername = ? AND status != 'seen'
    `).run(nowIso, otherUsername, myUsername);

    io.to(otherUsername).emit('messages_seen', { by: myUsername, seenAt: nowIso });

    const stmt = db.prepare(`
      SELECT m.*, 
        (SELECT json_group_array(json_object('id', r.id, 'username', r.username, 'emoji', r.emoji)) 
         FROM message_reactions r WHERE r.messageId = m.id) as reactionsJson
      FROM messages m
      WHERE (m.senderUsername = ? AND m.receiverUsername = ?)
         OR (m.senderUsername = ? AND m.receiverUsername = ?)
      ORDER BY m.createdAt ASC
    `);
    
    const messages = stmt.all(myUsername, otherUsername, otherUsername, myUsername).map((msg: any) => {
      let reactions = [];
      if (msg.reactionsJson && msg.reactionsJson !== '[{}]') { // SQLite json_group_array can return '[{}]' if empty depending on query, but here it might return '[]'
        try {
          reactions = JSON.parse(msg.reactionsJson);
          if (reactions.length === 1 && !reactions[0].id) {
            reactions = [];
          }
        } catch(e) {}
      }
      delete msg.reactionsJson;
      return { ...msg, reactions };
    });
    res.json(messages);
  });

  // Send Message
  app.post('/api/messages/:username', requireSession, upload.single('file'), async (req: any, res: any) => {
    const receiverUsername = req.params.username;
    const { content, parentId } = req.body;
    const file = req.file;
    const session = req.session;

    const partners = db.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN senderUsername = ? THEN receiverUsername 
          ELSE senderUsername 
        END as partner
      FROM messages 
      WHERE senderUsername = ? OR receiverUsername = ?
    `).all(session.username, session.username, session.username);
    
    const partnerSet = new Set(partners.map((p: any) => p.partner));
    if (partnerSet.size >= 20 && !partnerSet.has(receiverUsername)) {
      return res.status(403).json({ error: 'You have reached the maximum limit of 20 private chats.' });
    }

    const driveFileUrl = req.body.driveFileUrl;
    const driveFileName = req.body.driveFileName;
    const driveFileType = req.body.driveFileType;

    const msgId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    let fileUrl = file ? `/uploads/${file.filename}` : (driveFileUrl || null);
    
    if (file && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(file.path, { resource_type: "auto", chunk_size: 20000000 }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        fileUrl = (result as any).secure_url;
        fs.unlinkSync(file.path);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(500).json({ error: `Cloudinary upload error: ${err.message || 'Unknown error'}` });
      }
    }

    const fileName = file ? file.originalname : (driveFileName || null);
    const fileType = file ? file.mimetype : (driveFileType || null);

    const stmt = db.prepare(`
      INSERT INTO messages (id, senderId, senderUsername, receiverUsername, content, parentId, fileUrl, fileName, fileType, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(msgId, session.id, session.username, receiverUsername, content || null, parentId || null, fileUrl, fileName, fileType, expiresAt);

    const newMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    
    // Broadcast message to specific room
    io.to(receiverUsername).emit('new_message', newMsg);
    // Also echo back to sender in case they are connected from multiple clients
    io.to(session.username).emit('new_message', newMsg);
    
    res.json(newMsg);
  });

  // Toggle Pin Message
  app.post('/api/messages/:id/pin', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;

    const msg = db.prepare('SELECT senderUsername, receiverUsername, isPinned FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    
    if (msg.senderUsername !== session.username && msg.receiverUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const newPinned = msg.isPinned ? 0 : 1;
    db.prepare('UPDATE messages SET isPinned = ? WHERE id = ?').run(newPinned, messageId);

    io.to(msg.senderUsername).emit('message_pinned', { messageId, isPinned: newPinned });
    io.to(msg.receiverUsername).emit('message_pinned', { messageId, isPinned: newPinned });

    return res.json({ success: true, isPinned: newPinned });
  });

  // React to Message
  app.post('/api/messages/:id/react', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const { emoji } = req.body;
    const session = req.session;

    if (!emoji) return res.status(400).json({ error: 'Emoji required' });

    // Check if message exists
    const msg = db.prepare('SELECT senderUsername, receiverUsername FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    
    // Check if user is authorized to react (must be sender or receiver)
    if (msg.senderUsername !== session.username && msg.receiverUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Check if user already reacted to this message at all
    const existing = db.prepare('SELECT id, emoji FROM message_reactions WHERE messageId = ? AND username = ?').get(messageId, session.username) as any;
    
    if (existing) {
      // Remove the old reaction
      db.prepare('DELETE FROM message_reactions WHERE id = ?').run(existing.id);
      io.to(msg.senderUsername).emit('message_reaction', { messageId, username: session.username, emoji: existing.emoji, removed: true });
      io.to(msg.receiverUsername).emit('message_reaction', { messageId, username: session.username, emoji: existing.emoji, removed: true });
      
      // If they clicked the exact same emoji, it's a toggle-off.
      if (existing.emoji === emoji) {
        return res.json({ success: true, removed: true });
      }
    }
    
    // Add the new reaction
    const reactionId = uuidv4();
    db.prepare(`
      INSERT INTO message_reactions (id, messageId, username, emoji, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(reactionId, messageId, session.username, emoji, expiresAt);
    
    const newReaction = { id: reactionId, messageId, username: session.username, emoji };
    io.to(msg.senderUsername).emit('message_reaction', newReaction);
    io.to(msg.receiverUsername).emit('message_reaction', newReaction);
    return res.json({ success: true, reaction: newReaction });
  });


  // --- Sockets ---
  io.on('connection', (socket) => {
    socket.on('join', (username: string) => {
      if (username) {
        socket.join(username);
        // Optionally track online status
        io.emit('user_online', username);
      }
    });
    
    socket.on('typing', (data) => {
      io.to(data.to).emit('typing', { username: data.from, avatar: data.avatar, color: data.color });
    });
    
    socket.on('stop_typing', (data) => {
      io.to(data.to).emit('stop_typing', { username: data.from });
    });

    socket.on('message_delivered', (data) => {
      try {
        db.prepare(`
          UPDATE messages SET status = 'delivered' 
          WHERE id = ? AND status = 'sent'
        `).run(data.messageId);
        io.to(data.senderUsername).emit('message_status_update', { messageId: data.messageId, status: 'delivered' });
      } catch(e) {}
    });

    socket.on('messages_seen', (data) => {
      try {
        const nowIso = new Date().toISOString();
        db.prepare(`
          UPDATE messages SET status = 'seen', seenAt = ? 
          WHERE senderUsername = ? AND receiverUsername = ? AND status != 'seen'
        `).run(nowIso, data.to, data.from); // from is the one who saw it, so receiver = from, sender = to
        io.to(data.to).emit('messages_seen', { by: data.from, seenAt: nowIso });
      } catch(e) {}
    });
  });

  // --- Background Cleanup ---
  // Delete expired items every minute
  setInterval(async () => {
    const now = new Date().toISOString();
    
    // Select files to delete from FS and Cloudinary
    const expiredPosts = db.prepare('SELECT fileUrl FROM posts WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now) as any[];
    const expiredMsgs = db.prepare('SELECT fileUrl FROM messages WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now) as any[];
    
    for (const item of [...expiredPosts, ...expiredMsgs]) {
      if (item.fileUrl) {
        if (item.fileUrl.includes('cloudinary.com')) {
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
              // Extract public_id from Cloudinary URL
              // Format: https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<version>/<public_id>.<ext>
              const urlParts = item.fileUrl.split('/');
              const filenameWithExt = urlParts[urlParts.length - 1];
              const publicId = filenameWithExt.split('.')[0];
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.error('Failed to delete from Cloudinary:', err);
            }
          }
        } else if (item.fileUrl.startsWith('/uploads/')) {
          const filename = item.fileUrl.replace('/uploads/', '');
          const filepath = path.join(uploadDir, filename);
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
      }
    }

    db.prepare('DELETE FROM posts WHERE expiresAt < ?').run(now);
    db.prepare('DELETE FROM message_reactions WHERE expiresAt < ?').run(now);
    db.prepare('DELETE FROM messages WHERE expiresAt < ?').run(now);
    db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(now);
  }, 60 * 1000);


  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

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

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  app.use(cors());
  app.use(express.json());

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
      fileUrl TEXT,
      fileName TEXT,
      fileType TEXT,
      status TEXT DEFAULT 'sent',
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

  try {
    db.exec("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'");
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
  const upload = multer({ storage });

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

  // Search users
  app.get('/api/users/search', requireSession, (req: any, res: any) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    const stmt = db.prepare("SELECT username, color, avatar, expiresAt FROM sessions WHERE username LIKE ? AND username != ? LIMIT 10");
    const users = stmt.all(`%${query}%`, req.session.username);
    console.log('Search query:', query, 'Result length:', users.length);
    res.json(users);
  });

  // Get Posts
  app.get('/api/posts', requireSession, (req: any, res: any) => {
    const stmt = db.prepare('SELECT * FROM posts ORDER BY createdAt DESC LIMIT 100');
    const posts = stmt.all();
    res.json(posts);
  });

  // Create Post
  app.post('/api/posts', requireSession, upload.single('file'), (req: any, res: any) => {
    const { content } = req.body;
    const file = req.file;
    const session = req.session;

    if (!content && !file) {
      return res.status(400).json({ error: 'Must provide content or file' });
    }

    const postId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const fileUrl = file ? `/uploads/${file.filename}` : null;
    const fileName = file ? file.originalname : null;
    const fileType = file ? file.mimetype : null;

    const stmt = db.prepare(`
      INSERT INTO posts (id, sessionId, username, color, avatar, content, fileUrl, fileName, fileType, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(postId, session.id, session.username, session.color, session.avatar, content, fileUrl, fileName, fileType, expiresAt);

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

    // Mark as seen
    db.prepare(`
      UPDATE messages SET status = 'seen' 
      WHERE senderUsername = ? AND receiverUsername = ? AND status != 'seen'
    `).run(otherUsername, myUsername);

    io.to(otherUsername).emit('messages_seen', { by: myUsername });

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
  app.post('/api/messages/:username', requireSession, upload.single('file'), (req: any, res: any) => {
    const receiverUsername = req.params.username;
    const { content } = req.body;
    const file = req.file;
    const session = req.session;

    const msgId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const fileUrl = file ? `/uploads/${file.filename}` : null;
    const fileName = file ? file.originalname : null;
    const fileType = file ? file.mimetype : null;

    const stmt = db.prepare(`
      INSERT INTO messages (id, senderId, senderUsername, receiverUsername, content, fileUrl, fileName, fileType, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(msgId, session.id, session.username, receiverUsername, content, fileUrl, fileName, fileType, expiresAt);

    const newMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    
    // Broadcast message to specific room
    io.to(receiverUsername).emit('new_message', newMsg);
    // Also echo back to sender in case they are connected from multiple clients
    io.to(session.username).emit('new_message', newMsg);
    
    res.json(newMsg);
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
        db.prepare(`
          UPDATE messages SET status = 'seen' 
          WHERE senderUsername = ? AND receiverUsername = ? AND status != 'seen'
        `).run(data.to, data.from); // from is the one who saw it, so receiver = from, sender = to
        io.to(data.to).emit('messages_seen', { by: data.from });
      } catch(e) {}
    });
  });

  // --- Background Cleanup ---
  // Delete expired items every minute
  setInterval(() => {
    const now = new Date().toISOString();
    
    // Select files to delete from FS
    const expiredPosts = db.prepare('SELECT fileUrl FROM posts WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now) as any[];
    const expiredMsgs = db.prepare('SELECT fileUrl FROM messages WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now) as any[];
    
    [...expiredPosts, ...expiredMsgs].forEach((item: any) => {
      const filename = item.fileUrl.replace('/uploads/', '');
      const filepath = path.join(uploadDir, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    });

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

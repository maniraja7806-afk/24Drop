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
// @ts-ignore
import archiver from 'archiver';
import https from 'https';
import http from 'http';

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
  app.use(express.json({ limit: '5gb' }));
  app.use(express.urlencoded({ limit: '5gb', extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Set up Database
  const dbPath = path.join(process.cwd(), 'database.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

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
      isPinned BOOLEAN DEFAULT 0,
      isEdited BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pinned_posts (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      pinnedByUserId TEXT NOT NULL,
      pinnedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(postId) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(postId, pinnedByUserId)
    );
    CREATE INDEX IF NOT EXISTS idx_pinned_posts_postId ON pinned_posts(postId);
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
      isEdited BOOLEAN DEFAULT 0,
      seenAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pinned_messages (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      pinnedByUserId TEXT NOT NULL,
      pinnedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE,
      UNIQUE(messageId, pinnedByUserId)
    );
    CREATE INDEX IF NOT EXISTS idx_pinned_messages_messageId ON pinned_messages(messageId);
    CREATE TABLE IF NOT EXISTS message_reactions (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS post_reactions (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      FOREIGN KEY(postId) REFERENCES posts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  
  const getSetting = (key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return row ? row.value : null;
  };
  
  const setSetting = (key: string, value: string) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  };
  
  // Migration for existing databases
  try {
    db.prepare('ALTER TABLE messages ADD COLUMN isPinned BOOLEAN DEFAULT 0').run();
  } catch (e) {
    // Column might already exist
  }

  try {
    db.prepare('ALTER TABLE posts ADD COLUMN isPinned BOOLEAN DEFAULT 0').run();
  } catch (e) {
    // Column might already exist
  }

  try {
    db.prepare('ALTER TABLE posts ADD COLUMN isEdited BOOLEAN DEFAULT 0').run();
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'");
  } catch(e) {}
  
  try {
    db.exec("ALTER TABLE messages ADD COLUMN seenAt DATETIME");
  } catch(e) {}

  try {
    db.exec("ALTER TABLE messages ADD COLUMN isEdited BOOLEAN DEFAULT 0");
  } catch(e) {}

  try {
    db.exec("ALTER TABLE posts ADD COLUMN fileSize INTEGER");
  } catch(e) {}

  try {
    db.exec("ALTER TABLE messages ADD COLUMN fileSize INTEGER");
  } catch(e) {}

  try { db.exec("ALTER TABLE messages ADD COLUMN folderName TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE messages ADD COLUMN folderFiles TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE posts ADD COLUMN folderName TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE posts ADD COLUMN folderFiles TEXT"); } catch(e) {}

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
    limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB limit
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
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
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
  
  // Storage usage calculation logic
  function getFileCategoryFromExtOrType(fileName: string | null, fileType: string | null): 'images' | 'videos' | 'audio' | 'documents' | 'others' {
    const ext = fileName ? path.extname(fileName).toLowerCase() : '';
    const type = fileType ? fileType.toLowerCase() : '';

    if (type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'].includes(ext)) {
      return 'images';
    }
    if (type.startsWith('video/') || ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'].includes(ext)) {
      return 'videos';
    }
    if (type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.wma'].includes(ext)) {
      return 'audio';
    }
    if (type.includes('pdf') || type.includes('document') || type.includes('text') || type.includes('sheet') || type.includes('zip') ||
        ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.tar', '.gz', '.json', '.csv', '.md', '.html', '.js', '.ts', '.py'].includes(ext)) {
      return 'documents';
    }
    return 'others';
  }

  function calculateStorageUsage() {
    const limitBytes = 25 * 1024 * 1024 * 1024; // 25GB
    let usageBytes = 0;
    const categories = {
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0,
      others: 0
    };

    const uploadDir = path.join(process.cwd(), 'uploads');
    const diskFiles = new Set<string>();

    if (fs.existsSync(uploadDir)) {
      try {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
          diskFiles.add(file);
          try {
            const filePath = path.join(uploadDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const size = stat.size;
              usageBytes += size;
              const cat = getFileCategoryFromExtOrType(file, null);
              categories[cat] += size;
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    // Check DB for any remote / external / Cloudinary files where fileSize > 0
    try {
      const posts = db.prepare('SELECT fileSize, fileUrl, fileName, fileType FROM posts WHERE fileSize > 0 AND fileUrl IS NOT NULL').all() as any[];
      for (const p of posts) {
        if (p.fileUrl && p.fileUrl.startsWith('/uploads/')) {
          const fn = p.fileUrl.replace('/uploads/', '');
          if (diskFiles.has(fn)) continue; // Already counted from disk
        }
        const size = Number(p.fileSize || 0);
        usageBytes += size;
        const cat = getFileCategoryFromExtOrType(p.fileName, p.fileType);
        categories[cat] += size;
      }

      const msgs = db.prepare('SELECT fileSize, fileUrl, fileName, fileType FROM messages WHERE fileSize > 0 AND fileUrl IS NOT NULL').all() as any[];
      for (const m of msgs) {
        if (m.fileUrl && m.fileUrl.startsWith('/uploads/')) {
          const fn = m.fileUrl.replace('/uploads/', '');
          if (diskFiles.has(fn)) continue; // Already counted from disk
        }
        const size = Number(m.fileSize || 0);
        usageBytes += size;
        const cat = getFileCategoryFromExtOrType(m.fileName, m.fileType);
        categories[cat] += size;
      }
    } catch (e) {}

    return { usageBytes, limitBytes, categories };
  }

  function broadcastStorageUpdate() {
    const usage = calculateStorageUsage();
    io.emit('storage_updated', usage);
  }

  // Storage usage
  app.get('/api/storage/usage', requireSession, async (req: any, res: any) => {
    try {
      res.json(calculateStorageUsage());
    } catch (err) {
      console.error('Failed to calculate storage usage:', err);
      res.status(500).json({ error: 'Failed to fetch storage usage' });
    }
  });

  // Clear Storage
  app.post('/api/storage/clear', requireSession, async (req: any, res: any) => {
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        // Run in background to prevent request timeout
        (async () => {
          try {
            await cloudinary.api.delete_all_resources({ resource_type: 'image' });
            await cloudinary.api.delete_all_resources({ resource_type: 'video' });
            await cloudinary.api.delete_all_resources({ resource_type: 'raw' });
          } catch(e) {
            console.error('Cloudinary background delete error:', e);
          }
        })();
      }
      
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(uploadDir, file));
          } catch(e) {}
        }
      }

      db.prepare('DELETE FROM posts').run();
      db.prepare('DELETE FROM messages').run();
      db.prepare('DELETE FROM message_reactions').run();

      setSetting('last_cleared_time', Date.now().toString());

      broadcastStorageUpdate();

      res.json({ success: true });
    } catch (err) {
      console.error('Failed to clear storage:', err);
      res.status(500).json({ error: 'Failed to clear storage' });
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

  // Draft Upload Endpoint (immediate background upload)
  app.post('/api/upload/draft', requireSession, upload.single('file'), async (req: any, res: any) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let fileUrl = `/uploads/${file.filename}`;
    let fileSize = file.size;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const resourceType = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/') ? "auto" : "raw";
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(file.path, { resource_type: resourceType, chunk_size: 20000000 }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        fileUrl = (result as any).secure_url;
        if ((result as any).bytes) fileSize = (result as any).bytes;
        setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);
        return res.status(500).json({ error: `Cloudinary upload error: ${err.message || 'Unknown error'}` });
      }
    }

    const draftFileId = uuidv4();
    broadcastStorageUpdate();
    res.json({
      success: true,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize,
      draftFileId
    });
  });

  // Get Posts
  app.get('/api/posts', requireSession, (req: any, res: any) => {
    const stmt = db.prepare(`
      SELECT p.*, 
        (SELECT json_group_array(json_object('id', r.id, 'username', r.username, 'emoji', r.emoji)) 
         FROM post_reactions r WHERE r.postId = p.id) as reactionsJson
      FROM posts p
      ORDER BY p.createdAt ASC LIMIT 100
    `);
    const posts = stmt.all().map((post: any) => {
      let reactions = [];
      if (post.reactionsJson && post.reactionsJson !== '[{}]') {
        try {
          reactions = JSON.parse(post.reactionsJson);
          if (reactions.length === 1 && !reactions[0].id) {
            reactions = [];
          }
        } catch(e) {}
      }
      delete post.reactionsJson;
      return { ...post, reactions };
    });
    res.json(posts);
  });

  // React to Post
  app.post('/api/posts/:id/react', requireSession, (req: any, res: any) => {
    const postId = req.params.id;
    const { emoji } = req.body;
    const session = req.session;

    if (!emoji) return res.status(400).json({ error: 'Emoji required' });

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId) as any;
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const existing = db.prepare('SELECT id, emoji FROM post_reactions WHERE postId = ? AND username = ?').get(postId, session.username) as any;

    if (existing) {
      db.prepare('DELETE FROM post_reactions WHERE id = ?').run(existing.id);
      io.emit('post_reaction', { postId, username: session.username, emoji: existing.emoji, removed: true });

      if (existing.emoji === emoji) {
        return res.json({ success: true, removed: true });
      }
    }

    const reactionId = uuidv4();
    db.prepare(`
      INSERT INTO post_reactions (id, postId, username, emoji, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(reactionId, postId, session.username, emoji, expiresAt);

    const newReaction = { id: reactionId, postId, username: session.username, emoji };
    io.emit('post_reaction', newReaction);
    return res.json({ success: true, reaction: newReaction });
  });

  // Create Post
  app.post('/api/posts', requireSession, upload.single('file'), async (req: any, res: any) => {
    const { content, parentId, fileUrl: bodyFileUrl, fileName: bodyFileName, fileType: bodyFileType, fileSize: bodyFileSize, folderName, folderFiles } = req.body;
    const file = req.file;
    const session = req.session;

    const driveFileUrl = req.body.driveFileUrl;
    const driveFileName = req.body.driveFileName;
    const driveFileType = req.body.driveFileType;

    if (!content && !file && !bodyFileUrl && !driveFileUrl && !folderFiles) {
      return res.status(400).json({ error: 'Must provide content, file, folderFiles or drive link' });
    }

    const postId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    let fileUrl = bodyFileUrl || (file ? `/uploads/${file.filename}` : (driveFileUrl || null));
    
    if (file && !bodyFileUrl && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await new Promise((resolve, reject) => {
          const resourceType = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/") ? "auto" : "raw";
          cloudinary.uploader.upload_large(file.path, { resource_type: resourceType, chunk_size: 20000000 }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        fileUrl = (result as any).secure_url;
        setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);
        return res.status(500).json({ error: `Cloudinary upload error: ${err.message || 'Unknown error'}` });
      }
    }

    const fileName = bodyFileName || (file ? file.originalname : (driveFileName || null));
    const fileType = bodyFileType || (file ? file.mimetype : (driveFileType || null));
    const fileSize = bodyFileSize ? Number(bodyFileSize) : (file ? file.size : null);

    const stmt = db.prepare(`
      INSERT INTO posts (id, sessionId, username, color, avatar, content, parentId, fileUrl, fileName, fileType, fileSize, folderName, folderFiles, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(postId, session.id, session.username, session.color, session.avatar, content || null, parentId || null, fileUrl, fileName, fileType, fileSize, folderName || null, folderFiles || null, expiresAt);

    const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    
    // Broadcast via socket
    io.emit('new_post', newPost);
    broadcastStorageUpdate();
    
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
    db.prepare('DELETE FROM post_reactions WHERE postId = ?').run(postId);

    io.emit('delete_post', postId);
    broadcastStorageUpdate();
    res.json({ success: true });
  });

  // Edit Post
  app.put('/api/posts/:id', requireSession, (req: any, res: any) => {
    const postId = req.params.id;
    const session = req.session;
    const { content } = req.body;

    const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
    const post: any = stmt.get(postId);

    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.sessionId !== session.id) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare('UPDATE posts SET content = ?, isEdited = 1 WHERE id = ?').run(content, postId);
    io.emit('edit_post', { postId, content });
    res.json({ success: true, content });
  });

  // Toggle Pin Post
  app.post('/api/posts/:id/pin', requireSession, (req: any, res: any) => {
    const postId = req.params.id;
    const session = req.session;

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as any;
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const newPinned = post.isPinned ? 0 : 1;
    
    const togglePinTransaction = db.transaction(() => {
      db.prepare('UPDATE posts SET isPinned = ? WHERE id = ?').run(newPinned, postId);
      
      let replacedId = null;
      if (newPinned) {
        db.prepare('INSERT OR IGNORE INTO pinned_posts (id, postId, pinnedByUserId) VALUES (?, ?, ?)').run(uuidv4(), postId, session.id);
        
        const pins = db.prepare('SELECT id, postId FROM pinned_posts ORDER BY pinnedAt ASC').all() as any[];
        if (pins.length > 10) {
           const oldest = pins[0];
           db.prepare('DELETE FROM pinned_posts WHERE id = ?').run(oldest.id);
           db.prepare('UPDATE posts SET isPinned = 0 WHERE id = ?').run(oldest.postId);
           replacedId = oldest.postId;
        }
      } else {
        db.prepare('DELETE FROM pinned_posts WHERE postId = ?').run(postId);
      }
      return replacedId;
    });
    
    const replacedId = togglePinTransaction();

    io.emit('post_pinned', { postId, isPinned: newPinned });
    if (replacedId) {
        io.emit('post_pinned', { postId: replacedId, isPinned: 0, replaced: true });
    }

    return res.json({ success: true, isPinned: newPinned, replacedId });
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
    const { content, parentId, fileUrl: bodyFileUrl, fileName: bodyFileName, fileType: bodyFileType, fileSize: bodyFileSize, folderName, folderFiles } = req.body;
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
    
    let fileUrl = bodyFileUrl || (file ? `/uploads/${file.filename}` : (driveFileUrl || null));
    
    if (file && !bodyFileUrl && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await new Promise((resolve, reject) => {
          const resourceType = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/") ? "auto" : "raw";
          cloudinary.uploader.upload_large(file.path, { resource_type: resourceType, chunk_size: 20000000 }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        fileUrl = (result as any).secure_url;
        setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        setTimeout(() => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }, 10000);
        return res.status(500).json({ error: `Cloudinary upload error: ${err.message || 'Unknown error'}` });
      }
    }

    const fileName = bodyFileName || (file ? file.originalname : (driveFileName || null));
    const fileType = bodyFileType || (file ? file.mimetype : (driveFileType || null));
    const fileSize = bodyFileSize ? Number(bodyFileSize) : (file ? file.size : null);

    const stmt = db.prepare(`
      INSERT INTO messages (id, senderId, senderUsername, receiverUsername, content, parentId, fileUrl, fileName, fileType, fileSize, folderName, folderFiles, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(msgId, session.id, session.username, receiverUsername, content || null, parentId || null, fileUrl, fileName, fileType, fileSize, folderName || null, folderFiles || null, expiresAt);

    const newMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    
    // Broadcast message to specific room
    io.to(receiverUsername).emit('new_message', newMsg);
    // Also echo back to sender in case they are connected from multiple clients
    io.to(session.username).emit('new_message', newMsg);
    broadcastStorageUpdate();
    
    res.json(newMsg);
  });


  const handleFolderDownload = (req: any, res: any, item: any) => {
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

    res.attachment(`${item.folderName || 'Folder'}.zip`);
    archive.pipe(res);

    const fetchAndAppend = (fileObj: any) => {
      return new Promise<void>((resolve) => {
        const { name, fileUrl } = fileObj;
        if (!fileUrl) return resolve();

        if (fileUrl.startsWith('http')) {
          const client = fileUrl.startsWith('https') ? https : http;
          client.get(fileUrl, (response) => {
            if (response.statusCode === 200) {
              archive.append(response, { name });
              response.on('end', () => resolve());
              response.on('error', () => resolve());
            } else {
              resolve(); // Skip failed
            }
          }).on('error', () => resolve());
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

  app.get('/api/messages/:id/download-folder', requireSession, (req: any, res: any) => {
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id) as any;
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.senderUsername !== req.session.username && msg.receiverUsername !== req.session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    handleFolderDownload(req, res, msg);
  });

  const handleIndividualFileDownload = (req: any, res: any, item: any, filenameToDownload: string) => {
    if (!item || !item.folderFiles) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    let files = [];
    try {
      files = JSON.parse(item.folderFiles);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid folder data' });
    }

    const fileObj = files.find((f: any) => f.name === filenameToDownload);
    if (!fileObj || !fileObj.fileUrl) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { name, fileUrl } = fileObj;
    const downloadName = (name || '').split('/').pop() || 'download';

    if (fileUrl.startsWith('http')) {
      const client = fileUrl.startsWith('https') ? https : http;
      client.get(fileUrl, (response: any) => {
        if (response.statusCode !== 200) {
          if (!res.headersSent) {
            res.status(response.statusCode).send(`
              <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f5f5f5; color: #333;">
                  <div style="text-align: center; max-width: 500px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h2 style="margin-top: 0; color: #e53e3e;">Download Failed</h2>
                    <p>The file could not be downloaded from the remote server (Status ${response.statusCode}).</p>
                    <p>This is often caused by remote storage restrictions (e.g. Cloudinary blocking PDF delivery). Please try uploading the file again.</p>
                  </div>
                </body>
              </html>
            `);
          }
          return;
        }
        res.attachment(downloadName);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        response.pipe(res);
      }).on('error', () => {
        if (!res.headersSent) res.status(500).send('Failed to download remote file');
      });
    } else {
      const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
      if (fs.existsSync(filePath)) {
        res.download(filePath, downloadName);
      } else {
        res.status(404).json({ error: 'File not found locally' });
      }
    }
  };

  app.get('/api/proxy-download', requireSession, (req: any, res: any) => {
    const fileUrl = req.query.url as string;
    const filename = req.query.filename as string || 'download';
    if (!fileUrl) return res.status(400).json({ error: 'Missing url parameter' });

    if (fileUrl.startsWith('http')) {
      const client = fileUrl.startsWith('https') ? https : http;
      client.get(fileUrl, (response: any) => {
        if (response.statusCode !== 200) {
          if (!res.headersSent) res.status(response.statusCode).send('Failed to download remote file');
          return;
        }
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        response.pipe(res);
      }).on('error', () => {
        if (!res.headersSent) res.status(500).send('Failed to download remote file');
      });
    } else {
      res.status(400).json({ error: 'Invalid URL' });
    }
  });

  app.get('/api/messages/:id/download-file', requireSession, (req: any, res: any) => {
    const filename = req.query.filename;
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id) as any;
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.senderUsername !== req.session.username && msg.receiverUsername !== req.session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    handleIndividualFileDownload(req, res, msg, filename);
  });

  app.get('/api/posts/:id/download-folder', requireSession, (req: any, res: any) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: 'Not found' });
    handleFolderDownload(req, res, post);
  });

  app.get('/api/posts/:id/download-file', requireSession, (req: any, res: any) => {
    const filename = req.query.filename;
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: 'Not found' });
    handleIndividualFileDownload(req, res, post, filename);
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
    
    const togglePinTransaction = db.transaction(() => {
      db.prepare('UPDATE messages SET isPinned = ? WHERE id = ?').run(newPinned, messageId);
      
      let replacedId = null;
      if (newPinned) {
        db.prepare('INSERT OR IGNORE INTO pinned_messages (id, messageId, pinnedByUserId) VALUES (?, ?, ?)').run(uuidv4(), messageId, session.id);
        
        const chatPins = db.prepare(`
            SELECT p.id, p.messageId
            FROM pinned_messages p
            JOIN messages m ON p.messageId = m.id
            WHERE (m.senderUsername = ? AND m.receiverUsername = ?)
               OR (m.senderUsername = ? AND m.receiverUsername = ?)
            ORDER BY p.pinnedAt ASC
        `).all(msg.senderUsername, msg.receiverUsername, msg.receiverUsername, msg.senderUsername) as any[];
        
        if (chatPins.length > 10) {
            const oldest = chatPins[0];
            db.prepare('DELETE FROM pinned_messages WHERE id = ?').run(oldest.id);
            db.prepare('UPDATE messages SET isPinned = 0 WHERE id = ?').run(oldest.messageId);
            replacedId = oldest.messageId;
        }
      } else {
        db.prepare('DELETE FROM pinned_messages WHERE messageId = ?').run(messageId);
      }
      return replacedId;
    });
    
    const replacedId = togglePinTransaction();

    io.to(msg.senderUsername).emit('message_pinned', { messageId, isPinned: newPinned });
    io.to(msg.receiverUsername).emit('message_pinned', { messageId, isPinned: newPinned });
    if (replacedId) {
        io.to(msg.senderUsername).emit('message_pinned', { messageId: replacedId, isPinned: 0, replaced: true });
        io.to(msg.receiverUsername).emit('message_pinned', { messageId: replacedId, isPinned: 0, replaced: true });
    }

    return res.json({ success: true, isPinned: newPinned, replacedId });
  });

  // Edit Message
  app.put('/api/messages/:id', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const { content } = req.body;
    const msg = db.prepare('SELECT senderUsername, receiverUsername FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized to edit' });
    }

    db.prepare('UPDATE messages SET content = ?, isEdited = 1 WHERE id = ?').run(content, messageId);
    
    io.to(msg.senderUsername).emit('edit_message', { messageId, content });
    io.to(msg.receiverUsername).emit('edit_message', { messageId, content });
    
    return res.json({ success: true, content });
  });

  // Delete Message
  app.delete('/api/messages/:id', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const msg = db.prepare('SELECT senderUsername, receiverUsername, fileUrl FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized to delete' });
    }

    if (msg.fileUrl) {
      if (msg.fileUrl.startsWith('/uploads/')) {
        const filename = msg.fileUrl.replace('/uploads/', '');
        const filepath = path.join(uploadDir, filename);
        if (fs.existsSync(filepath)) {
          try { fs.unlinkSync(filepath); } catch (e) {}
        }
      } else if (msg.fileUrl.includes('cloudinary.com') && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const urlParts = msg.fileUrl.split('/');
          const filenameWithExt = urlParts[urlParts.length - 1];
          const publicId = filenameWithExt.split('.')[0];
          cloudinary.uploader.destroy(publicId).catch(() => {});
        } catch (e) {}
      }
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
    db.prepare('DELETE FROM message_reactions WHERE messageId = ?').run(messageId);
    
    io.to(msg.senderUsername).emit('delete_message', { messageId });
    io.to(msg.receiverUsername).emit('delete_message', { messageId });
    broadcastStorageUpdate();
    
    return res.json({ success: true });
  });

  // React to Message
  app.post('/api/messages/:id/react', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const { emoji } = req.body;
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
    socket.emit('storage_updated', calculateStorageUsage());

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

    // We'll let the DB clean up CASCADE, but explicitly clean pinned records to be safe:
    db.prepare('DELETE FROM pinned_posts WHERE postId IN (SELECT id FROM posts WHERE expiresAt < ?)').run(now);
    db.prepare('DELETE FROM pinned_messages WHERE messageId IN (SELECT id FROM messages WHERE expiresAt < ?)').run(now);

    db.prepare('DELETE FROM posts WHERE expiresAt < ?').run(now);
    db.prepare('DELETE FROM message_reactions WHERE expiresAt < ?').run(now);
    db.prepare('DELETE FROM messages WHERE expiresAt < ?').run(now);
    db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(now);

    broadcastStorageUpdate();
  }, 60 * 1000);


  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { 
        middlewareMode: true,
        hmr: { server: httpServer }
      },
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

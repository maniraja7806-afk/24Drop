import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import connectToDatabase from './src/db/mongodb';
import { Session, Post, Message, MessageReaction, PostReaction, PinnedPost, PinnedMessage, Setting } from './src/db/mongoModels';
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

  app.use('/api', async (req, res, next) => {
    if (req.path === '/health' || req.path === '/server-time') return next();
    try {
      await connectToDatabase();
      next();
    } catch (err) {
      console.error('Database connection error:', err);
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/server-time', (req, res) => {
    res.json({ 
      serverTime: new Date().toISOString(),
      serverTimeMs: Date.now()
    });
  });

  // Set up Database
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas at startup:', err);
  }

  const getSetting = async (key: string) => {
    const doc = await Setting.findOne({ key });
    return doc ? doc.value : null;
  };
  
  const setSetting = async (key: string, value: string) => {
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
  };

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
  app.get('/api/usernames/generate', async (req, res) => {
    const adjectives = ['Blue', 'Nova', 'Pixel', 'Neon', 'Cyber', 'Quantum', 'Cosmic', 'Solar', 'Echo', 'Ghost'];
    const nouns = ['Falcon', 'Tiger', 'Wolf', 'Dragon', 'Phantom', 'Sphinx', 'Pulse', 'Viper', 'Rider', 'Nomad'];
    
    const generateName = async () => {
      let name;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 100) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        name = `${adj}${noun}${num}`;
        const existing = await Session.findOne({ username: name });
        if (!existing) isUnique = true;
        attempts++;
      }
      return name;
    };

    const usernames: string[] = [];
    while (usernames.length < 3) {
      const name = await generateName();
      if (name && !usernames.includes(name)) {
        usernames.push(name);
      }
    }
    res.json({ usernames });
  });

  // Claim a username and create a 24-hour session
  app.post('/api/usernames/claim', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const existing = await Session.findOne({ username });
    if (existing) {
      return res.json({ 
        sessionId: existing._id, 
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
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const session = new Session({
      _id: sessionId,
      username, color, avatar, expiresAt
    });
    await session.save();

    res.json({ sessionId, username, color, avatar, expiresAt });
  });

  // Session middleware
  const requireSession = async (req: any, res: any, next: any) => {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    if (!sessionId) return res.status(401).json({ error: 'Missing session' });
    
    const session = await Session.findById(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return res.status(401).json({ error: 'Invalid or expired session' });
    
    req.session = Object.assign(session.toObject(), { id: session._id });
    next();
  };

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

  async function calculateStorageUsage() {
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

    try {
      const posts = await Post.find({ fileSize: { $gt: 0 }, fileUrl: { $ne: null } });
      for (const p of posts) {
        if (p.fileUrl && p.fileUrl.startsWith('/uploads/')) {
          const fn = p.fileUrl.replace('/uploads/', '');
          if (diskFiles.has(fn)) continue;
        }
        const size = Number(p.fileSize || 0);
        usageBytes += size;
        const cat = getFileCategoryFromExtOrType(p.fileName, p.fileType);
        categories[cat] += size;
      }

      const msgs = await Message.find({ fileSize: { $gt: 0 }, fileUrl: { $ne: null } });
      for (const m of msgs) {
        if (m.fileUrl && m.fileUrl.startsWith('/uploads/')) {
          const fn = m.fileUrl.replace('/uploads/', '');
          if (diskFiles.has(fn)) continue;
        }
        const size = Number(m.fileSize || 0);
        usageBytes += size;
        const cat = getFileCategoryFromExtOrType(m.fileName, m.fileType);
        categories[cat] += size;
      }
    } catch (e) {}

    return { usageBytes, limitBytes, categories };
  }

  async function broadcastStorageUpdate() {
    const usage = await calculateStorageUsage();
    io.emit('storage_updated', usage);
  }

  // Storage usage
  app.get('/api/storage/usage', requireSession, async (req: any, res: any) => {
    try {
      res.json(await calculateStorageUsage());
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

      await Post.deleteMany({});
      await Message.deleteMany({});
      await MessageReaction.deleteMany({});
      await PostReaction.deleteMany({});
      await PinnedPost.deleteMany({});
      await PinnedMessage.deleteMany({});

      await setSetting('last_cleared_time', Date.now().toString());

      broadcastStorageUpdate();

      res.json({ success: true });
    } catch (err) {
      console.error('Failed to clear storage:', err);
      res.status(500).json({ error: 'Failed to clear storage' });
    }
  });

  // Search users
  app.get('/api/users/search', requireSession, async (req: any, res: any) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    const users = await Session.find({ expiresAt: { $gt: new Date().toISOString() }, username: { $regex: query, $options: 'i' } })
      .select('username color avatar expiresAt')
      .limit(10)
      .lean();
    console.log('Search query:', query, 'Result length:', users.length);
    res.json(users);
  });

  app.get('/api/chats', requireSession, async (req: any, res: any) => {
    const session = req.session;
    
    // Get unique partners sorted by the latest message time
    const messages = await Message.find({
      expiresAt: { $gt: new Date().toISOString() },
      $or: [{ senderUsername: session.username }, { receiverUsername: session.username }]
    }).sort({ createdAt: -1 }).lean();

    const partnerMap = new Map();
    for (const m of messages) {
      const partner = m.senderUsername === session.username ? m.receiverUsername : m.senderUsername;
      if (!partnerMap.has(partner)) {
        partnerMap.set(partner, m.createdAt);
      }
      if (partnerMap.size >= 20) break;
    }

    const partners = Array.from(partnerMap.entries()).map(([username, lastMessageAt]) => ({
      username,
      lastMessageAt
    }));
    
    if (partners.length === 0) {
      return res.json([]);
    }
    
    const usernames = partners.map(p => p.username);
    const usersInfo = await Session.find({ username: { $in: usernames } }).select('username color avatar').lean();
    
    const enrichedPartners = partners.map(p => {
      const info = usersInfo.find(u => u.username === p.username);
      return {
        ...p,
        color: info ? info.color : 'bg-neutral-500',
        avatar: info ? info.avatar : '👤'
      };
    });
    
    res.json(enrichedPartners);
  });

  app.get('/api/search', requireSession, async (req: any, res: any) => {
    const query = req.query.q;
    const session = req.session;
    if (!query) return res.json({ posts: [], messages: [] });
    
    const posts = await Post.find({
      expiresAt: { $gt: new Date().toISOString() },
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { fileName: { $regex: query, $options: 'i' } }
      ]
    }).limit(20).lean();

    const messages = await Message.find({
      expiresAt: { $gt: new Date().toISOString() },
      $and: [
        { $or: [{ senderUsername: session.username }, { receiverUsername: session.username }] },
        { $or: [
          { content: { $regex: query, $options: 'i' } },
          { fileName: { $regex: query, $options: 'i' } }
        ]}
      ]
    }).limit(20).lean();
    
    res.json({ posts: posts.map(p => ({ ...p, id: p._id })), messages: messages.map(m => ({ ...m, id: m._id })) });
  });

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
  app.get('/api/posts', requireSession, async (req: any, res: any) => {
    const posts = await Post.find({ expiresAt: { $gt: new Date().toISOString() } }).sort({ createdAt: 1 }).limit(100).lean();
    
    // Fetch reactions for these posts
    const postIds = posts.map(p => p._id);
    const allReactions = await PostReaction.find({ postId: { $in: postIds } }).lean();
    
    const enrichedPosts = posts.map(post => {
      const reactions = allReactions
        .filter(r => r.postId === post._id)
        .map(r => ({ id: r._id, username: r.username, emoji: r.emoji }));
      return { ...post, id: post._id, reactions };
    });

    res.json(enrichedPosts);
  });

  app.post('/api/posts/:id/react', requireSession, async (req: any, res: any) => {
    const postId = req.params.id;
    const { emoji } = req.body;
    const session = req.session;

    if (!emoji) return res.status(400).json({ error: 'Emoji required' });

    const post = await Post.findById(postId);
    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Post not found' });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const existing = await PostReaction.findOne({ postId, username: session.username });

    if (existing) {
      await PostReaction.deleteOne({ _id: existing._id });
      io.emit('post_reaction', { postId, username: session.username, emoji: existing.emoji, removed: true });

      if (existing.emoji === emoji) {
        return res.json({ success: true, removed: true });
      }
    }

    const reactionId = uuidv4();
    const reaction = new PostReaction({
      _id: reactionId, postId, username: session.username, emoji, expiresAt
    });
    await reaction.save();

    const newReaction = { id: reactionId, postId, username: session.username, emoji };
    io.emit('post_reaction', newReaction);
    return res.json({ success: true, reaction: newReaction });
  });

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

    const newPost = new Post({
      _id: postId, username: session.username, content: content || null, parentId: parentId || null, 
      fileUrl, fileName, fileType, fileSize, folderName: folderName || null, folderFiles: folderFiles || null, 
      expiresAt, color: session.color, avatar: session.avatar, sessionId: session.id
    });
    
    await newPost.save();

    const postObj = { ...newPost.toObject(), id: newPost._id };
    
    io.emit('new_post', postObj);
    await broadcastStorageUpdate();
    
    res.json(postObj);
  });

  // Delete Post
  app.delete('/api/posts/:id', requireSession, async (req: any, res: any) => {
    const postId = req.params.id;
    const session = req.session;

    const post = await Post.findById(postId);
    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });
    if (post.sessionId !== session.id && post.username !== session.username) return res.status(403).json({ error: 'Unauthorized' });

    if (post.fileUrl) {
      if (post.fileUrl.startsWith('/uploads/')) {
        const filename = post.fileUrl.replace('/uploads/', '');
        const filepath = path.join(uploadDir, filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      } else if (post.fileUrl.includes('cloudinary.com') && process.env.CLOUDINARY_CLOUD_NAME) {
         try {
           const urlParts = post.fileUrl.split('/');
           const filenameWithExt = urlParts[urlParts.length - 1];
           const publicId = filenameWithExt.split('.')[0];
           cloudinary.uploader.destroy(publicId).catch(() => {});
         } catch(e) {}
      }
    }

    await Post.deleteOne({ _id: postId });
    await PostReaction.deleteMany({ postId });
    await PinnedPost.deleteMany({ postId });

    io.emit('delete_post', postId);
    await broadcastStorageUpdate();
    res.json({ success: true });
  });

    // Edit Post
  app.put('/api/posts/:id', requireSession, async (req: any, res: any) => {
    const postId = req.params.id;
    const session = req.session;
    const { content } = req.body;

    const post = await Post.findById(postId);
    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });
    if (post.sessionId !== session.id && post.username !== session.username) return res.status(403).json({ error: 'Unauthorized' });

    post.content = content;
    post.isEdited = true;
    await post.save();

    io.emit('edit_post', { postId, content });
    res.json({ success: true, content });
  });

    // Toggle Pin Post
  app.post('/api/posts/:id/pin', requireSession, async (req: any, res: any) => {
    const postId = req.params.id;
    const session = req.session;

    const post = await Post.findById(postId);
    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Post not found' });
    
    const newPinned = post.isPinned ? false : true;
    let replacedId = null;

    if (newPinned) {
      post.isPinned = true;
      await post.save();
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const existingPin = await PinnedPost.findOne({ postId, pinnedByUserId: session.id });
      if (!existingPin) {
        const pin = new PinnedPost({
          _id: uuidv4(), postId, pinnedByUserId: session.id, expiresAt
        });
        await pin.save();
      }

      const pins = await PinnedPost.find().sort({ pinnedAt: 1 }).lean();
      if (pins.length > 10) {
         const oldest = pins[0];
         await PinnedPost.deleteOne({ _id: oldest._id });
         await Post.updateOne({ _id: oldest.postId }, { $set: { isPinned: false } });
         replacedId = oldest.postId;
      }
    } else {
      post.isPinned = false;
      await post.save();
      await PinnedPost.deleteMany({ postId });
    }
    
    io.emit('post_pinned', { postId, isPinned: newPinned ? 1 : 0 });
    if (replacedId) {
        io.emit('post_pinned', { postId: replacedId, isPinned: 0, replaced: true });
    }

    return res.json({ success: true, isPinned: newPinned ? 1 : 0, replacedId });
  });

    // Get Messages
  app.get('/api/messages/:username', requireSession, async (req: any, res: any) => {
    const otherUsername = req.params.username;
    const myUsername = req.session.username;

    const nowIso = new Date().toISOString();
    
    await Message.updateMany(
      { senderUsername: otherUsername, receiverUsername: myUsername, status: { $ne: 'seen' } },
      { $set: { status: 'seen', seenAt: nowIso } }
    );

    io.to(otherUsername).emit('messages_seen', { by: myUsername, seenAt: nowIso });

    const messages = await Message.find({
      expiresAt: { $gt: new Date().toISOString() },
      $or: [
        { senderUsername: myUsername, receiverUsername: otherUsername },
        { senderUsername: otherUsername, receiverUsername: myUsername }
      ]
    }).sort({ createdAt: 1 }).limit(100).lean();
    
    const messageIds = messages.map(m => m._id);
    const allReactions = await MessageReaction.find({ messageId: { $in: messageIds } }).lean();

    const enrichedMessages = messages.map(msg => {
      const reactions = allReactions
        .filter(r => r.messageId === msg._id)
        .map(r => ({ id: r._id, username: r.username, emoji: r.emoji }));
      return { ...msg, id: msg._id, reactions };
    });
    
    res.json(enrichedMessages);
  });

    // Send Message
  app.post('/api/messages/:username', requireSession, upload.single('file'), async (req: any, res: any) => {
    const receiverUsername = req.params.username;
    const { content, parentId, fileUrl: bodyFileUrl, fileName: bodyFileName, fileType: bodyFileType, fileSize: bodyFileSize, folderName, folderFiles } = req.body;
    const file = req.file;
    const session = req.session;

    const messages = await Message.find({
      $or: [{ senderUsername: session.username }, { receiverUsername: session.username }]
    }).lean();
    
    const partnerSet = new Set(messages.map(m => m.senderUsername === session.username ? m.receiverUsername : m.senderUsername));
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

    const sortUsers = [session.username, receiverUsername].sort();
    const chatId = `${sortUsers[0]}_${sortUsers[1]}`;

    const newMsg = new Message({
      _id: msgId, senderId: session.id, senderUsername: session.username, receiverUsername, chatId,
      content: content || null, parentId: parentId || null, 
      fileUrl, fileName, fileType, fileSize, folderName: folderName || null, folderFiles: folderFiles || null, 
      expiresAt
    });
    
    await newMsg.save();

    const msgObj = { ...newMsg.toObject(), id: newMsg._id };
    
    io.to(receiverUsername).emit('new_message', msgObj);
    io.to(session.username).emit('new_message', msgObj);
    await broadcastStorageUpdate();
    
    res.json(msgObj);
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

  app.get('/api/messages/:id/download-folder', requireSession, async (req: any, res: any) => {
    const msg = await Message.findById(req.params.id);
    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });
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

  app.get('/api/messages/:id/download-file', requireSession, async (req: any, res: any) => {
    const filename = req.query.filename;
    const msg = await Message.findById(req.params.id);
    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });
    if (msg.senderUsername !== req.session.username && msg.receiverUsername !== req.session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    handleIndividualFileDownload(req, res, msg, filename);
  });

  app.get('/api/posts/:id/download-folder', requireSession, async (req: any, res: any) => {
    const post = await Post.findById(req.params.id);
    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });
    handleFolderDownload(req, res, post);
  });

  app.get('/api/posts/:id/download-file', requireSession, async (req: any, res: any) => {
    const filename = req.query.filename;
    const post = await Post.findById(req.params.id);
    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });
    handleIndividualFileDownload(req, res, post, filename);
  });

  // Toggle Pin Message
  app.post('/api/messages/:id/pin', requireSession, async (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const msg = await Message.findById(messageId);
    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Message not found' });
    
    if (msg.senderUsername !== session.username && msg.receiverUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const newPinned = msg.isPinned ? false : true;
    let replacedId = null;

    if (newPinned) {
      msg.isPinned = true;
      await msg.save();
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const existingPin = await PinnedMessage.findOne({ messageId, pinnedByUserId: session.id });
      if (!existingPin) {
        const pin = new PinnedMessage({
          _id: uuidv4(), messageId, pinnedByUserId: session.id, chatId: msg.chatId, expiresAt
        });
        await pin.save();
      }

      const chatPins = await PinnedMessage.find({ chatId: msg.chatId }).sort({ pinnedAt: 1 }).lean();
      
      if (chatPins.length > 10) {
          const oldest = chatPins[0];
          await PinnedMessage.deleteOne({ _id: oldest._id });
          await Message.updateOne({ _id: oldest.messageId }, { $set: { isPinned: false } });
          replacedId = oldest.messageId;
      }
    } else {
      msg.isPinned = false;
      await msg.save();
      await PinnedMessage.deleteMany({ messageId });
    }

    io.to(msg.senderUsername).emit('message_pinned', { messageId, isPinned: newPinned ? 1 : 0 });
    io.to(msg.receiverUsername).emit('message_pinned', { messageId, isPinned: newPinned ? 1 : 0 });
    if (replacedId) {
        io.to(msg.senderUsername).emit('message_pinned', { messageId: replacedId, isPinned: 0, replaced: true });
        io.to(msg.receiverUsername).emit('message_pinned', { messageId: replacedId, isPinned: 0, replaced: true });
    }

    return res.json({ success: true, isPinned: newPinned ? 1 : 0, replacedId });
  });

    // Edit Message
  app.put('/api/messages/:id', requireSession, async (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const { content } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized to edit' });
    }

    msg.content = content;
    msg.isEdited = true;
    await msg.save();
    
    io.to(msg.senderUsername).emit('edit_message', { messageId, content });
    io.to(msg.receiverUsername).emit('edit_message', { messageId, content });
    
    return res.json({ success: true, content });
  });

    // Delete Message
  app.delete('/api/messages/:id', requireSession, async (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const msg = await Message.findById(messageId);
    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Message not found' });
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

    await Message.deleteOne({ _id: messageId });
    await MessageReaction.deleteMany({ messageId });
    await PinnedMessage.deleteMany({ messageId });
    
    io.to(msg.senderUsername).emit('delete_message', { messageId });
    io.to(msg.receiverUsername).emit('delete_message', { messageId });
    await broadcastStorageUpdate();
    
    return res.json({ success: true });
  });

    // React to Message
  app.post('/api/messages/:id/react', requireSession, async (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const { emoji } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Message not found' });
    
    if (msg.senderUsername !== session.username && msg.receiverUsername !== session.username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const existing = await MessageReaction.findOne({ messageId, username: session.username });
    
    if (existing) {
      await MessageReaction.deleteOne({ _id: existing._id });
      io.to(msg.senderUsername).emit('message_reaction', { messageId, username: session.username, emoji: existing.emoji, removed: true });
      io.to(msg.receiverUsername).emit('message_reaction', { messageId, username: session.username, emoji: existing.emoji, removed: true });
      
      if (existing.emoji === emoji) {
        return res.json({ success: true, removed: true });
      }
    }
    
    const reactionId = uuidv4();
    const reaction = new MessageReaction({
      _id: reactionId, messageId, username: session.username, emoji, expiresAt
    });
    await reaction.save();
    
    const newReaction = { id: reactionId, messageId, username: session.username, emoji };
    io.to(msg.senderUsername).emit('message_reaction', newReaction);
    io.to(msg.receiverUsername).emit('message_reaction', newReaction);
    return res.json({ success: true, reaction: newReaction });
  });


  // --- Sockets ---
  io.on('connection', (socket) => {
    calculateStorageUsage().then(usage => socket.emit('storage_updated', usage));

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

    socket.on('message_delivered', async (data) => {
      try {
        await Message.updateOne(
          { _id: data.messageId, status: 'sent' },
          { $set: { status: 'delivered' } }
        );
        io.to(data.senderUsername).emit('message_status_update', { messageId: data.messageId, status: 'delivered' });
      } catch(e) {}
    });

    socket.on('messages_seen', async (data) => {
      try {
        const nowIso = new Date().toISOString();
        await Message.updateMany(
          { senderUsername: data.to, receiverUsername: data.from, status: { $ne: 'seen' } },
          { $set: { status: 'seen', seenAt: nowIso } }
        );
        io.to(data.to).emit('messages_seen', { by: data.from, seenAt: nowIso });
      } catch(e) {}
    });
  });

  // --- Diagnostic Expiration Route ---
  app.get('/api/diagnostics/expiration', async (req: any, res: any) => {
    try {
      const now = new Date().toISOString();
      const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      const posts = await Post.find().sort({ createdAt: -1 }).limit(5).select('_id createdAt expiresAt').lean();
      const messages = await Message.find().sort({ createdAt: -1 }).limit(5).select('_id createdAt expiresAt').lean();
      const sessions = await Session.find().sort({ expiresAt: -1 }).limit(5).select('_id expiresAt').lean();
      
      const soonExpiringPosts = await Post.countDocuments({ expiresAt: { $lt: nextHour } });
      const soonExpiringMessages = await Message.countDocuments({ expiresAt: { $lt: nextHour } });

      res.json({
        serverTime: now,
        timestampMathCheck: {
          nowMs: Date.now(),
          plus24hMs: Date.now() + (24 * 60 * 60 * 1000),
          calculated24hISO: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
        },
        expiringWithinOneHour: {
          posts: soonExpiringPosts,
          messages: soonExpiringMessages
        },
        latestRecords: {
          posts,
          messages,
          sessions
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Background Cleanup ---
  // Delete expired items every minute
  setInterval(async () => {
    try {
    const now = new Date().toISOString();
    
    // Select files to delete from FS and Cloudinary
    const expiredPosts = await Post.find({ expiresAt: { $lt: now }, fileUrl: { $ne: null } }).lean();
    const expiredMsgs = await Message.find({ expiresAt: { $lt: now }, fileUrl: { $ne: null } }).lean();
    
    for (const item of [...expiredPosts, ...expiredMsgs]) {
      if (item.fileUrl) {
        if (item.fileUrl.includes('cloudinary.com')) {
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
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

    // Since MongoDB TTL might handle deleting documents, we do our best effort manual cleanup
    // for cloud files above. If TTL deleted it before this tick, we might miss the fileUrl.
    // However, TTL in MongoDB isn't instantaneous (usually runs every 60s), so we race it.
    // It is recommended to use TTL indexes for DB cleanup and a separate cloud function or cron for storage,
    // but we will keep this loop for safety.

    // Let's manually trigger deletion to ensure cloud files aren't missed.
    await PinnedPost.deleteMany({ postId: { $in: expiredPosts.map(p => p._id) } });
    await PinnedMessage.deleteMany({ messageId: { $in: expiredMsgs.map(m => m._id) } });
    
    await Post.deleteMany({ expiresAt: { $lt: now } });
    await MessageReaction.deleteMany({ expiresAt: { $lt: now } });
    await Message.deleteMany({ expiresAt: { $lt: now } });
    await Session.deleteMany({ expiresAt: { $lt: now } });

    await broadcastStorageUpdate();
    } catch(e) {}
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

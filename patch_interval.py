import re

with open('server.ts', 'r') as f:
    content = f.read()

c = """  setInterval(async () => {
    const now = new Date().toISOString();
    
    // Select files to delete from FS and Cloudinary
    const expiredPosts = await Post.find({ expiresAt: { $lt: now }, fileUrl: { $ne: null } }).lean();"""

r = """  setInterval(async () => {
    try {
    const now = new Date().toISOString();
    
    // Select files to delete from FS and Cloudinary
    const expiredPosts = await Post.find({ expiresAt: { $lt: now }, fileUrl: { $ne: null } }).lean();"""

content = content.replace(c, r)

c2 = """    await Message.deleteMany({ expiresAt: { $lt: now } });
    await Session.deleteMany({ expiresAt: { $lt: now } });

    await broadcastStorageUpdate();
  }, 60 * 1000);"""

r2 = """    await Message.deleteMany({ expiresAt: { $lt: now } });
    await Session.deleteMany({ expiresAt: { $lt: now } });

    await broadcastStorageUpdate();
    } catch(e) {}
  }, 60 * 1000);"""

content = content.replace(c2, r2)

with open('server.ts', 'w') as f:
    f.write(content)

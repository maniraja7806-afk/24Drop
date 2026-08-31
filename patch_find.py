import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add expiresAt to GET posts
c1 = "const posts = await Post.find().sort({ createdAt: 1 }).limit(100).lean();"
r1 = "const posts = await Post.find({ expiresAt: { $gt: new Date().toISOString() } }).sort({ createdAt: 1 }).limit(100).lean();"
content = content.replace(c1, r1)

# Add expiresAt to Search posts
c2 = """const posts = await Post.find({
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { fileName: { $regex: query, $options: 'i' } }
      ]
    }).limit(20).lean();"""
r2 = """const posts = await Post.find({
      expiresAt: { $gt: new Date().toISOString() },
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { fileName: { $regex: query, $options: 'i' } }
      ]
    }).limit(20).lean();"""
content = content.replace(c2, r2)

# Add expiresAt to get chats messages
c3 = """const messages = await Message.find({
      $or: [{ senderUsername: session.username }, { receiverUsername: session.username }]
    }).sort({ createdAt: -1 }).lean();"""
r3 = """const messages = await Message.find({
      expiresAt: { $gt: new Date().toISOString() },
      $or: [{ senderUsername: session.username }, { receiverUsername: session.username }]
    }).sort({ createdAt: -1 }).lean();"""
content = content.replace(c3, r3)

# Add expiresAt to search messages
c4 = """const messages = await Message.find({
      $and: [
        { $or: [{ senderUsername: session.username }, { receiverUsername: session.username }] },
        { $or: [
          { content: { $regex: query, $options: 'i' } },
          { fileName: { $regex: query, $options: 'i' } }
        ]}
      ]
    }).limit(20).lean();"""
r4 = """const messages = await Message.find({
      expiresAt: { $gt: new Date().toISOString() },
      $and: [
        { $or: [{ senderUsername: session.username }, { receiverUsername: session.username }] },
        { $or: [
          { content: { $regex: query, $options: 'i' } },
          { fileName: { $regex: query, $options: 'i' } }
        ]}
      ]
    }).limit(20).lean();"""
content = content.replace(c4, r4)

# Add expiresAt to get messages
c5 = """const messages = await Message.find({
      $or: [
        { senderUsername: myUsername, receiverUsername: otherUsername },
        { senderUsername: otherUsername, receiverUsername: myUsername }
      ]
    }).sort({ createdAt: 1 }).limit(100).lean();"""
r5 = """const messages = await Message.find({
      expiresAt: { $gt: new Date().toISOString() },
      $or: [
        { senderUsername: myUsername, receiverUsername: otherUsername },
        { senderUsername: otherUsername, receiverUsername: myUsername }
      ]
    }).sort({ createdAt: 1 }).limit(100).lean();"""
content = content.replace(c5, r5)

# Also check session expiration in middleware
c6 = """const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ error: 'Invalid or expired session' });"""
r6 = """const session = await Session.findById(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return res.status(401).json({ error: 'Invalid or expired session' });"""
content = content.replace(c6, r6)

# also users search
c7 = """const users = await Session.find({ username: { $regex: query, $options: 'i' } })"""
r7 = """const users = await Session.find({ expiresAt: { $gt: new Date().toISOString() }, username: { $regex: query, $options: 'i' } })"""
content = content.replace(c7, r7)

with open('server.ts', 'w') as f:
    f.write(content)

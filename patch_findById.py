import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace findById followed by if(!post)
c1 = r"const post = await Post\.findById\((.*?)\);\n    if \(!post\) return res\.status\(404\)\.json\(\{ error: 'Not found' \}\);"
r1 = r"const post = await Post.findById(\1);\n    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });"
content = re.sub(c1, r1, content)

c1_b = r"const post = await Post\.findById\((.*?)\);\n    if \(!post\) return res\.status\(404\)\.json\(\{ error: 'Post not found' \}\);"
r1_b = r"const post = await Post.findById(\1);\n    if (!post || new Date(post.expiresAt) <= new Date()) return res.status(404).json({ error: 'Post not found' });"
content = re.sub(c1_b, r1_b, content)


c2 = r"const msg = await Message\.findById\((.*?)\);\n    if \(!msg\) return res\.status\(404\)\.json\(\{ error: 'Not found' \}\);"
r2 = r"const msg = await Message.findById(\1);\n    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Not found' });"
content = re.sub(c2, r2, content)

c2_b = r"const msg = await Message\.findById\((.*?)\);\n    if \(!msg\) return res\.status\(404\)\.json\(\{ error: 'Message not found' \}\);"
r2_b = r"const msg = await Message.findById(\1);\n    if (!msg || new Date(msg.expiresAt) <= new Date()) return res.status(404).json({ error: 'Message not found' });"
content = re.sub(c2_b, r2_b, content)

with open('server.ts', 'w') as f:
    f.write(content)

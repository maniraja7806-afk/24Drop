const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For Edit Message
code = code.replace(
  /app\.put\('\/api\/messages\/:id',[\s\S]*?if \(!msg\) return res\.status\(404\)\.json\({ error: 'Message not found' }\);\s*if \(msg\.senderUsername !== session\.username\) {/g,
  `app.put('/api/messages/:id', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const { content } = req.body;
    const msg = db.prepare('SELECT senderUsername, receiverUsername FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderUsername !== session.username) {`
);

// For Delete Message
code = code.replace(
  /app\.delete\('\/api\/messages\/:id',[\s\S]*?if \(!msg\) return res\.status\(404\)\.json\({ error: 'Message not found' }\);\s*if \(msg\.senderUsername !== session\.username\) {/g,
  `app.delete('/api/messages/:id', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const msg = db.prepare('SELECT senderUsername, receiverUsername, fileUrl FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderUsername !== session.username) {`
);

// Fix Pin Message (Restore)
code = code.replace(
  /app\.post\('\/api\/messages\/:id\/pin',[\s\S]*?if \(!msg\) return res\.status\(404\)\.json\({ error: 'Message not found' }\);\s*if \(msg\.senderUsername !== session\.username\) {/g,
  `app.post('/api/messages/:id/pin', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const msg = db.prepare('SELECT senderUsername, receiverUsername, isPinned FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    
    if (msg.senderUsername !== session.username && msg.receiverUsername !== session.username) {`
);

// Fix React Message (Restore)
code = code.replace(
  /app\.post\('\/api\/messages\/:id\/react',[\s\S]*?if \(!msg\) return res\.status\(404\)\.json\({ error: 'Message not found' }\);\s*\/\/ Check if user is authorized to react[\s\S]*?if \(msg\.senderUsername !== session\.username\) {/g,
  `app.post('/api/messages/:id/react', requireSession, (req: any, res: any) => {
    const messageId = req.params.id;
    const session = req.session;
    const { emoji } = req.body;
    const msg = db.prepare('SELECT senderUsername, receiverUsername FROM messages WHERE id = ?').get(messageId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    
    // Check if user is authorized to react (must be sender or receiver)
    if (msg.senderUsername !== session.username && msg.receiverUsername !== session.username) {`
);

fs.writeFileSync('server.ts', code);

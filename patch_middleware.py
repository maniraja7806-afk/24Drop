import re

with open('server.ts', 'r') as f:
    content = f.read()

c = """  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });"""
r = """  app.use('/api', async (req, res, next) => {
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
  });"""
content = content.replace(c, r)

with open('server.ts', 'w') as f:
    f.write(content)

import re

with open('server.ts', 'r') as f:
    content = f.read()

c = """  // Set up Database
  await connectToDatabase();
  console.log('Connected to MongoDB Atlas');"""
r = """  // Set up Database
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas at startup:', err);
  }"""
content = content.replace(c, r)

with open('server.ts', 'w') as f:
    f.write(content)

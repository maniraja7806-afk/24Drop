const fs = require('fs');
fs.writeFileSync('test.txt', 'hello world');

fetch('http://localhost:3000/api/usernames/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'testuser123' })
}).then(res => res.json()).then(session => {
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync('test.txt')]), 'test.txt');

  return fetch('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: {
      'x-session-id': session.sessionId
    },
    body: formData
  });
}).then(res => res.text()).then(console.log).catch(console.error);

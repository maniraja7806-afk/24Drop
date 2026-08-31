const http = require('http');
http.get('http://localhost:3000/api/posts', (res) => {
  res.on('data', d => process.stdout.write(d));
});

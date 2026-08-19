const { exec } = require('child_process');
exec('netstat -lntp', (err, stdout) => console.log(stdout));

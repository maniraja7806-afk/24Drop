const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');
code = code.replace("fetchApi(`/api/users/search?q=${searchQuery}`).then(setSearchResults);", "fetchApi(`/api/users/search?q=${encodeURIComponent(searchQuery)}`).then(res => { console.log('Search results:', res); setSearchResults(res); }).catch(err => console.error('Search error:', err));");
fs.writeFileSync('src/components/MainApp.tsx', code);

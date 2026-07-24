const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const regex = /<form onSubmit=\{\(e\) => \{ e\.preventDefault\(\); handleSend\(\); \}\} className="flex items-end space-x-3">[\s\S]*?<\/form>/m;

const replacement = `<Composer 
              view={view}
              activeChat={activeChat}
              session={session}
              file={file}
              setFile={setFile}
              openCustomCamera={openCustomCamera}
              handleMicClick={handleMicClick}
            />`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Replaced form with Composer");

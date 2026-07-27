const fs = require('fs');
const file = 'src/components/MainApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const hook = `
  useEffect(() => {
    const handleResize = () => {
      if ((view === 'chat' || activeThread) && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view, activeThread]);
`;

content = content.replace(
  /const messagesEndRef = useRef<HTMLDivElement>\(null\);/g,
  `const messagesEndRef = useRef<HTMLDivElement>(null);\n${hook}`
);

fs.writeFileSync(file, content);

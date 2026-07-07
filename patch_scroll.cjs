const fs = require('fs');
let code = fs.readFileSync('src/components/Landing.tsx', 'utf8');

const oldRefs = `  const [loading, setLoading] = useState(false);
  const identityRef = useRef<HTMLDivElement>(null);`;

const newRefs = `  const [loading, setLoading] = useState(false);
  const identityRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);`;

code = code.replace(oldRefs, newRefs);

const oldScrollEffect = `  useEffect(() => {
    if (usernames.length > 0 && identityRef.current) {
      setTimeout(() => {
        identityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1200);
    }
  }, [usernames]);`;

const newScrollEffect = `  useEffect(() => {
    if (usernames.length > 0 && identityRef.current && containerRef.current) {
      setTimeout(() => {
        const container = containerRef.current;
        const target = identityRef.current;
        if (!container || !target) return;

        const targetPosition = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2);
        const startPosition = container.scrollTop;
        const distance = targetPosition - startPosition;
        const duration = 2500; // 2.5 seconds for a very slow, gentle scroll
        let start = null;

        const easeInOutQuad = (t, b, c, d) => {
          t /= d / 2;
          if (t < 1) return (c / 2) * t * t + b;
          t--;
          return (-c / 2) * (t * (t - 2) - 1) + b;
        };

        const animation = (currentTime) => {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
          container.scrollTop = run;
          if (timeElapsed < duration) {
            requestAnimationFrame(animation);
          } else {
            container.scrollTop = targetPosition;
          }
        };

        requestAnimationFrame(animation);
      }, 1200);
    }
  }, [usernames]);`;

code = code.replace(oldScrollEffect, newScrollEffect);

const oldContainer = `<div className="h-screen bg-neutral-950 text-white flex flex-col items-center relative overflow-x-hidden overflow-y-auto p-6">`;
const newContainer = `<div ref={containerRef} className="h-screen bg-neutral-950 text-white flex flex-col items-center relative overflow-x-hidden overflow-y-auto p-6 scroll-smooth">`;

code = code.replace(oldContainer, newContainer);

fs.writeFileSync('src/components/Landing.tsx', code);
console.log("Patched scrolling");

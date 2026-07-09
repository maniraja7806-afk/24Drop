const fs = require('fs');
let code = fs.readFileSync('src/components/LargeAudioVisualizer.tsx', 'utf8');

const oldFill = "ctx.fillStyle = `#3b82f6`; // blue-500";
const newFill = `
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#facc15'); // Gold
        gradient.addColorStop(0.5, '#4ade80'); // Neon green
        gradient.addColorStop(1, '#2dd4bf'); // Teal
        ctx.fillStyle = gradient;
`;

code = code.replace(oldFill, newFill);
fs.writeFileSync('src/components/LargeAudioVisualizer.tsx', code);
console.log("Patched LargeAudioVisualizer");

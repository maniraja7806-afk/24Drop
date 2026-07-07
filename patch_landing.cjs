const fs = require('fs');
let code = fs.readFileSync('src/components/Landing.tsx', 'utf8');

const oldContainer = `<div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center relative overflow-x-hidden overflow-y-auto p-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 opacity-80" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center max-w-lg w-full text-center space-y-8"
      >`;

const newContainer = `<div className="h-screen bg-neutral-950 text-white flex flex-col items-center relative overflow-x-hidden overflow-y-auto p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 opacity-80" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center max-w-lg w-full text-center space-y-24 mt-24 pb-48"
      >`;

code = code.replace(oldContainer, newContainer);
fs.writeFileSync('src/components/Landing.tsx', code);

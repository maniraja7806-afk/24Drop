const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

if (!code.includes('TransformWrapper')) {
  code = code.replace("import EmojiPicker, { Theme } from 'emoji-picker-react';", "import EmojiPicker, { Theme } from 'emoji-picker-react';\nimport { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';");
}

const oldModal = `      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setViewingImage(null)}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={viewingImage}
              alt="Full screen view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>`;

const newModal = `      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
              >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.img
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    src={viewingImage}
                    alt="Full screen view"
                    className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                    style={{ maxHeight: '100vh', maxWidth: '100vw' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(oldModal, newModal);
fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched zoom pan pinch modal");

import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Check, X, Square, RectangleHorizontal, SmilePlus, Trash2 } from 'lucide-react';

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

const PREDEFINED_STICKERS = ['😀', '❤️', '🔥', '✨', '🎉', '🌟', '👀', '💯'];

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1); // default square
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [showStickers, setShowStickers] = useState(false);

  const addSticker = (emoji: string) => {
    setStickers(prev => [...prev, { id: Math.random().toString(), emoji, x: 50, y: 50 }]);
    setShowStickers(false);
  };

  const handleStickerPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const imgEl = imgRef.current;
    if (!imgEl) return;
    const rect = imgEl.getBoundingClientRect();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;
    
    const startStickerX = sticker.x;
    const startStickerY = sticker.y;
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      const dxPercent = (dx / rect.width) * 100;
      const dyPercent = (dy / rect.height) * 100;
      
      setStickers(prev => prev.map(s => 
        s.id === id ? { ...s, x: startStickerX + dxPercent, y: startStickerY + dyPercent } : s
      ));
    };
    
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleConfirm = () => {
    if (!completedCrop || !imgRef.current) return;
    
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    if (stickers.length > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      stickers.forEach(sticker => {
        const stickerNaturalX = (sticker.x / 100) * imgRef.current!.naturalWidth;
        const stickerNaturalY = (sticker.y / 100) * imgRef.current!.naturalHeight;
        
        const canvasX = stickerNaturalX - (completedCrop.x * scaleX);
        const canvasY = stickerNaturalY - (completedCrop.y * scaleY);
        
        const fontSize = 48 * scaleX; 
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(sticker.emoji, canvasX, canvasY);
      });
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const f = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        onCropComplete(f);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button aria-label="Cancel crop" onClick={onCancel} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <div className="flex space-x-4 items-center">
          <button 
            aria-label="Crop Square"
            onClick={() => setAspect(1)} 
            className={`p-2 rounded ${aspect === 1 ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <Square className="w-5 h-5" />
          </button>
          <button 
            aria-label="Crop 16:9"
            onClick={() => setAspect(16 / 9)}
            className={`p-2 rounded ${aspect === 16 / 9 ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <RectangleHorizontal className="w-5 h-5" />
          </button>
          <button 
            aria-label="Free form crop"
            onClick={() => setAspect(undefined)}
            className={`p-2 rounded ${aspect === undefined ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <span className="text-xs font-medium px-1">Free</span>
          </button>
          
          <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
          
          <button 
            aria-label="Add sticker"
            onClick={() => setShowStickers(!showStickers)}
            className={`p-2 rounded ${showStickers ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <SmilePlus className="w-5 h-5" />
          </button>
          {stickers.length > 0 && (
            <button 
              aria-label="Clear stickers"
              onClick={() => setStickers([])}
              className="p-2 rounded text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <button aria-label="Confirm crop" onClick={handleConfirm} className="text-white p-2 bg-blue-500 hover:bg-blue-600 rounded-full">
          <Check className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
        {showStickers && (
          <div className="absolute top-4 left-4 right-4 p-3 bg-neutral-900/90 rounded-xl flex justify-center space-x-4 z-[110] shadow-2xl border border-white/10">
            {PREDEFINED_STICKERS.map(emoji => (
              <button key={emoji} className="text-3xl hover:scale-110 transition-transform" onClick={() => addSticker(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="relative inline-flex max-h-[70vh]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop me"
              className="max-h-[70vh] object-contain"
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (aspect) {
                  // Initialize crop to center
                  const cropWidth = aspect > 1 ? 100 : (aspect * naturalHeight / naturalWidth) * 100;
                  const cropHeight = aspect > 1 ? (1/aspect * naturalWidth / naturalHeight) * 100 : 100;
                  const safeWidth = Math.min(100, cropWidth);
                  const safeHeight = Math.min(100, cropHeight);
                  setCrop({
                    unit: '%',
                    x: (100 - safeWidth) / 2,
                    y: (100 - safeHeight) / 2,
                    width: safeWidth,
                    height: safeHeight
                  });
                } else {
                  setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
                }
              }}
            />
          </ReactCrop>
          
          {stickers.map(sticker => (
            <div
              key={sticker.id}
              onPointerDown={(e) => handleStickerPointerDown(e, sticker.id)}
              style={{
                position: 'absolute',
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: '48px',
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                zIndex: 105
              }}
            >
              {sticker.emoji}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateSeatPixels, PORTRAIT_TRAITS } from '../utils/pixelSeat';
import { sound } from '../utils/audio';
import argon01Img from '../assets/images/argon-01.png';
import bogle01Img from '../assets/images/bogle-01.png';
import midas01Img from '../assets/images/midas-01.png';
import smaug01Img from '../assets/images/smaug-01.png';
import vladd01Img from '../assets/images/vladd-01.png';

interface PixelCanvasProps {
  scale?: number;
  interactive?: boolean;
  activeFundId?: string;
  zoomLevel?: number; // 1 to 20
  onHoverPixel?: (pos: { x: number; y: number } | null) => void;
}

const AUTHENTIC_01_PORTRAITS: Record<string, { name: string; title: string; image: string; color: string }> = {
  argon: { name: 'ARGON 01', title: 'The Matriarch · Division I', image: argon01Img, color: '#60a5fa' },
  bogle: { name: 'BOGLE 01', title: 'The Skeleton · Division II', image: bogle01Img, color: '#34d399' },
  smaug: { name: 'SMAUG 01', title: 'Corporate Retriever · Division III', image: smaug01Img, color: '#f87171' },
  midas: { name: 'MIDAS 01', title: 'Gilded Aristocrat · Division IV', image: midas01Img, color: '#fbbf24' },
  vladd: { name: 'VLADD 01', title: 'Leveraged Rogue · Division V', image: vladd01Img, color: '#a78bfa' },
};

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  interactive = true,
  activeFundId = 'bogle',
  zoomLevel = 1,
  onHoverPixel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedFund, setSelectedFund] = useState<string>(activeFundId);
  const [viewMode, setViewMode] = useState<'authentic01' | 'traits'>('authentic01');
  const [portraitIndex, setPortraitIndex] = useState(0);
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const rawPixelsRef = useRef<Uint8ClampedArray | null>(null);

  // Sync selectedFund when prop changes
  useEffect(() => {
    setSelectedFund(activeFundId);
  }, [activeFundId]);

  // Load and sample image pixels for authentic 01 portrait
  useEffect(() => {
    if (viewMode === 'authentic01') {
      const portraitData = AUTHENTIC_01_PORTRAITS[selectedFund] || AUTHENTIC_01_PORTRAITS.bogle;
      const img = new Image();
      img.src = portraitData.image;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 64;
        offCanvas.height = 64;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(img, 0, 0, 64, 64);
        const imgData = offCtx.getImageData(0, 0, 64, 64);
        rawPixelsRef.current = new Uint8ClampedArray(imgData.data);
        renderCanvas();
      };
    } else {
      rawPixelsRef.current = generateSeatPixels(portraitIndex, selectedFund);
      renderCanvas();
    }
  }, [selectedFund, viewMode, portraitIndex]);

  // Render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rawPixelsRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Source 64x64 image data
    const imgData = ctx.createImageData(64, 64);
    const data = imgData.data;
    const raw = rawPixelsRef.current;

    for (let i = 0; i < raw.length; i++) {
      data[i] = raw[i];
    }

    // Apply interactive hover highlight if near mouse
    if (interactive && hoveredPixel) {
      const { x: hx, y: hy } = hoveredPixel;
      const radius = 3;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = hx + dx;
          const py = hy + dy;
          if (px >= 0 && px < 64 && py >= 0 && py < 64) {
            const dist = Math.hypot(dx, dy);
            if (dist <= radius) {
              const idx = (py * 64 + px) * 4;
              const intensity = (1 - dist / radius) * 120;
              data[idx] = Math.min(255, data[idx] + intensity);
              data[idx + 1] = Math.min(255, data[idx + 1] + intensity);
              data[idx + 2] = Math.min(255, data[idx + 2] + intensity);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [interactive, hoveredPixel]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, hoveredPixel]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const px = Math.floor((clientX / rect.width) * 64);
    const py = Math.floor((clientY / rect.height) * 64);

    if (px >= 0 && px < 64 && py >= 0 && py < 64) {
      if (!hoveredPixel || hoveredPixel.x !== px || hoveredPixel.y !== py) {
        setHoveredPixel({ x: px, y: py });
        onHoverPixel?.({ x: px, y: py });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPixel(null);
    onHoverPixel?.(null);
  };

  const currentPortrait = AUTHENTIC_01_PORTRAITS[selectedFund] || AUTHENTIC_01_PORTRAITS.bogle;
  const currentTrait = PORTRAIT_TRAITS[portraitIndex];

  return (
    <div className="relative flex flex-col items-center max-w-md mx-auto">
      {/* Top Fund Tabs for Authentic 01 Portraits */}
      <div className="flex items-center gap-1 mb-2.5 bg-black/60 p-1 border border-zinc-800 rounded-sm">
        {Object.entries(AUTHENTIC_01_PORTRAITS).map(([fKey, fData]) => (
          <button
            key={fKey}
            onClick={() => {
              setSelectedFund(fKey);
              setViewMode('authentic01');
              sound.play('click');
            }}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              selectedFund === fKey && viewMode === 'authentic01'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fData.color }} />
            <span>{fKey.toUpperCase()} 01</span>
          </button>
        ))}
      </div>

      {/* 64x64 Canvas with crisp nearest-neighbor rendering */}
      <div
        className="relative overflow-hidden border-2 border-[#3b352e] shadow-2xl bg-[#09090d] rounded-xs"
        style={{
          width: 'min(78vw, 340px)',
          height: 'min(78vw, 340px)',
          imageRendering: 'pixelated',
        }}
      >
        <canvas
          ref={canvasRef}
          width={64}
          height={64}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Pixel grid overlay visible when zoomed in */}
        {zoomLevel > 3 && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: `${100 / 64}% ${100 / 64}%`,
            }}
          />
        )}

        {/* Corner coordinates HUD */}
        <div className="absolute top-2 left-2 text-[10px] font-mono tracking-widest text-zinc-300 bg-black/75 px-1.5 py-0.5 border border-white/10 backdrop-blur-sm pointer-events-none">
          {hoveredPixel ? `P(${hoveredPixel.x.toString().padStart(2, '0')}, ${hoveredPixel.y.toString().padStart(2, '0')})` : '64×64 ON-CHAIN'}
        </div>

        {/* Badge showing active 01 portrait */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono tracking-wider text-amber-300 bg-black/80 px-1.5 py-0.5 border border-amber-500/30 backdrop-blur-sm pointer-events-none font-bold">
          {currentPortrait.name}
        </div>
      </div>

      {/* Active Portrait Metadata Bar */}
      <div className="mt-2.5 flex items-center justify-between w-full max-w-[340px] px-1 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[10px]">CHARACTER:</span>
          <span className="font-semibold text-amber-400 text-[11px]">{currentPortrait.title}</span>
        </div>

        <button
          onClick={() => {
            setViewMode((m) => (m === 'authentic01' ? 'traits' : 'authentic01'));
            sound.play('click');
          }}
          className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
        >
          {viewMode === 'authentic01' ? 'VIEW TRAITS' : 'BACK TO 01'}
        </button>
      </div>

      {/* Trait selector bar when in procedural mode */}
      {viewMode === 'traits' && (
        <div className="mt-2 flex items-center justify-between w-full max-w-[340px] px-1 text-xs font-mono bg-black/40 p-1 border border-zinc-800">
          <button
            onClick={() => {
              setPortraitIndex((prev) => (prev + 1) % PORTRAIT_TRAITS.length);
              sound.play('click');
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            TRAIT [{portraitIndex + 1}/11]: {currentTrait.name} →
          </button>
          <span className="text-zinc-400 text-[10px]">CHAIR: {currentTrait.chair}</span>
        </div>
      )}
    </div>
  );
};

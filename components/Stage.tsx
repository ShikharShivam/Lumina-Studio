import React, { useEffect, useRef, useState } from 'react';
import { Asset, FilterSettings, Track } from '../types';

interface StageProps {
  assets: Asset[];
  filterSettings: FilterSettings;
  isPlaying: boolean;
  onPlayPause: () => void;
  audioTrack: Track | null;
  audioEnhanced: boolean;
  onPlaybackComplete: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width?: number;
  height?: number;
}

export const Stage: React.FC<StageProps> = ({
  assets,
  filterSettings,
  isPlaying,
  onPlayPause,
  audioTrack,
  audioEnhanced,
  onPlaybackComplete,
  canvasRef,
  width = 1280,
  height = 720
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  
  const SLIDE_DURATION = 3000; // 3 seconds per slide

  // Setup Audio Context for "Enhance" feature
  useEffect(() => {
    if (!audioTrack) return;

    if (!audioRef.current) {
        audioRef.current = new Audio(audioTrack.url);
        audioRef.current.crossOrigin = "anonymous";
    } else {
        audioRef.current.src = audioTrack.url;
    }

    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
    }

    // Connect nodes if not already connected
    if (audioRef.current && audioCtxRef.current && !sourceNodeRef.current) {
        try {
            sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
            compressorNodeRef.current = audioCtxRef.current.createDynamicsCompressor();
            // Default compressor settings for "enhancement" (leveling)
            compressorNodeRef.current.threshold.setValueAtTime(-24, audioCtxRef.current.currentTime);
            compressorNodeRef.current.knee.setValueAtTime(30, audioCtxRef.current.currentTime);
            compressorNodeRef.current.ratio.setValueAtTime(12, audioCtxRef.current.currentTime);
            compressorNodeRef.current.attack.setValueAtTime(0.003, audioCtxRef.current.currentTime);
            compressorNodeRef.current.release.setValueAtTime(0.25, audioCtxRef.current.currentTime);

            sourceNodeRef.current.connect(compressorNodeRef.current);
            compressorNodeRef.current.connect(audioCtxRef.current.destination);
        } catch (e) {
            console.warn("Audio Context setup failed (likely waiting for user interaction)", e);
        }
    }

    return () => {
        if (isPlaying) audioRef.current?.pause();
    };
  }, [audioTrack]);

  // Handle Audio Enhancement Toggle
  useEffect(() => {
      if (sourceNodeRef.current && audioCtxRef.current && compressorNodeRef.current) {
          sourceNodeRef.current.disconnect();
          compressorNodeRef.current.disconnect();
          
          if (audioEnhanced) {
              // Route through compressor
              sourceNodeRef.current.connect(compressorNodeRef.current);
              compressorNodeRef.current.connect(audioCtxRef.current.destination);
          } else {
              // Route directly to destination
              sourceNodeRef.current.connect(audioCtxRef.current.destination);
          }
      }
  }, [audioEnhanced]);


  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;
    let lastIndex = -1;

    const render = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        // Calculate current slide index based on time
        // If assets empty, just clear
        if (assets.length === 0) {
             const ctx = canvasRef.current?.getContext('2d');
             if(ctx) {
                 ctx.fillStyle = '#0f172a';
                 ctx.fillRect(0, 0, width, height);
                 ctx.fillStyle = '#64748b';
                 ctx.font = '30px sans-serif';
                 ctx.textAlign = 'center';
                 ctx.fillText("No assets loaded", width/2, height/2);
             }
             return;
        }

        const totalDuration = assets.length * SLIDE_DURATION;
        
        if (elapsed >= totalDuration) {
            onPlaybackComplete();
            startTime = null;
            return; 
        }

        const index = Math.floor(elapsed / SLIDE_DURATION) % assets.length;
        if (index !== lastIndex) {
            setCurrentIndex(index);
            lastIndex = index;
        }

        const asset = assets[index];
        const ctx = canvasRef.current?.getContext('2d');

        if (ctx && asset) {
            // Background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            // Apply Filters
            ctx.filter = `brightness(${filterSettings.brightness}%) contrast(${filterSettings.contrast}%) saturate(${filterSettings.saturation}%) sepia(${filterSettings.sepia}%) blur(${filterSettings.blur}px)`;

            const img = new Image();
            img.src = asset.url;
            
            // Draw image (cover style)
            // Simplified: we assume image is loaded. In production, preloading is needed.
            if (img.complete) {
               drawImageCover(ctx, img, width, height);
            } else {
               // Fallback if not loaded instantly (flicker prevention)
               img.onload = () => drawImageCover(ctx, img, width, height);
            }
            
            // Reset filter for text/overlays
            ctx.filter = 'none';
        }

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(render);
        }
    };

    if (isPlaying) {
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        audioRef.current?.play().catch(e => console.log("Audio play failed", e));
        animationFrameId = requestAnimationFrame(render);
    } else {
        audioRef.current?.pause();
        // Render current static frame
        if (assets.length > 0) {
             // force a single render of current index
             // Not implemented for brevity, would reuse render logic logic without loop
        }
    }

    return () => {
        cancelAnimationFrame(animationFrameId);
        audioRef.current?.pause();
        if(audioRef.current) audioRef.current.currentTime = 0;
    };
  }, [isPlaying, assets, filterSettings, width, height]);

  // Helper to draw image 'cover' style
  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
      const iRatio = img.width / img.height;
      const cRatio = w / h;
      let sWidth, sHeight, sx, sy;

      if (cRatio > iRatio) {
          sWidth = img.width;
          sHeight = img.width / cRatio;
          sx = 0;
          sy = (img.height - sHeight) / 2;
      } else {
          sWidth = img.height * cRatio;
          sHeight = img.height;
          sx = (img.width - sWidth) / 2;
          sy = 0;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, w, h);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden shadow-2xl">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="max-w-full max-h-full object-contain"
      />
      {!isPlaying && assets.length > 0 && (
          <button 
            onClick={onPlayPause}
            className="absolute inset-0 m-auto w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all scale-100 hover:scale-110"
          >
              <i className="fa-solid fa-play text-white text-4xl ml-2"></i>
          </button>
      )}
      {isPlaying && (
           <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
               Slide {currentIndex + 1} / {assets.length}
           </div>
      )}
    </div>
  );
};

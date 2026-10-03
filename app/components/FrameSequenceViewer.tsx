"use client";

import React, { useEffect, useRef, useState } from "react";

interface FrameSequenceViewerProps {
  totalFrames?: number;
  frameDir?: string;
  framePrefix?: string;
  className?: string;
}

export function FrameSequenceViewer({
  totalFrames = 300,
  frameDir = "/frames",
  framePrefix = "frame-",
  className = "",
}: FrameSequenceViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation & Frame tracking
  const currentFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const needsRedrawRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);

  // Frame Cache
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedFlagsRef = useRef<boolean[]>([]);
  const [currentFrameNum, setCurrentFrameNum] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const getFrameUrl = (index: number) => {
    const padded = index.toString().padStart(3, "0");
    return `${frameDir}/${framePrefix}${padded}.jpg`;
  };

  // Find closest loaded image if target frame is still decoding
  const getClosestImage = (targetIndex: number): HTMLImageElement | null => {
    const images = imagesRef.current;
    const loaded = loadedFlagsRef.current;

    if (loaded[targetIndex] && images[targetIndex]) {
      return images[targetIndex];
    }

    for (let offset = 1; offset < totalFrames; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 1 && loaded[prev] && images[prev]) return images[prev];
      const next = targetIndex + offset;
      if (next <= totalFrames && loaded[next] && images[next]) return images[next];
    }

    return null;
  };

  // Draw frame on canvas with aspect ratio cover & retina DPR
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const img = getClosestImage(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Calculate aspect ratio cover
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let renderW = width;
    let renderH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = width;
      renderH = width / imgRatio;
      offsetY = (height - renderH) / 2;
    } else {
      renderH = height;
      renderW = height * imgRatio;
      offsetX = (width - renderW) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  };

  // Initialize preloader
  useEffect(() => {
    imagesRef.current = new Array(totalFrames + 1).fill(null);
    loadedFlagsRef.current = new Array(totalFrames + 1).fill(false);

    let isMounted = true;

    const loadSingleFrame = (idx: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (imagesRef.current[idx]) {
          resolve(imagesRef.current[idx]!);
          return;
        }

        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          if (!isMounted) return;
          imagesRef.current[idx] = img;
          loadedFlagsRef.current[idx] = true;

          if (idx === 1) {
            setIsLoaded(true);
            drawFrame(1);
            needsRedrawRef.current = true;
          }
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    };

    // Load Frame 1 immediately
    loadSingleFrame(1).then(() => {
      if (isMounted) {
        drawFrame(1);
        needsRedrawRef.current = true;
      }
    });

    // Progressive buffer
    const preloadAll = async () => {
      // First 20 frames for instant responsiveness
      for (let i = 2; i <= Math.min(20, totalFrames); i++) {
        if (!isMounted) return;
        await loadSingleFrame(i);
      }

      // Keyframes across timeline
      for (let i = 25; i <= totalFrames; i += 10) {
        if (!isMounted) return;
        await loadSingleFrame(i);
      }

      // Remaining frames in batches
      const remaining: number[] = [];
      for (let i = 1; i <= totalFrames; i++) {
        if (!loadedFlagsRef.current[i]) remaining.push(i);
      }

      const batchSize = 6;
      for (let i = 0; i < remaining.length; i += batchSize) {
        if (!isMounted) return;
        await Promise.all(remaining.slice(i, i + batchSize).map(loadSingleFrame));
      }
    };

    preloadAll();

    return () => {
      isMounted = false;
    };
  }, [totalFrames]);

  // Scroll listener & continuous Lerp animation loop
  useEffect(() => {
    const handleScroll = () => {
      // Find parent scroll track (container with data-scroll-track or body scroll)
      const track = document.getElementById("scroll-story-track");
      let progress = 0;

      if (track) {
        const rect = track.getBoundingClientRect();
        const totalDist = rect.height - window.innerHeight;
        if (totalDist > 0) {
          const scrolled = -rect.top;
          progress = Math.max(0, Math.min(1, scrolled / totalDist));
        }
      } else {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          progress = Math.max(0, Math.min(1, window.scrollY / docHeight));
        }
      }

      targetFrameRef.current = 1 + progress * (totalFrames - 1);
    };

    const handleResize = () => {
      handleScroll();
      needsRedrawRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    handleScroll();

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lerpFactor = prefersReducedMotion ? 1.0 : 0.12;

    const renderLoop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;

      if (Math.abs(diff) > 0.001) {
        currentFrameRef.current += diff * lerpFactor;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const frameToDraw = Math.round(currentFrameRef.current);

      if (frameToDraw !== lastDrawnFrameRef.current || needsRedrawRef.current) {
        drawFrame(frameToDraw);
        lastDrawnFrameRef.current = frameToDraw;
        needsRedrawRef.current = false;
        setCurrentFrameNum(frameToDraw);
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [totalFrames]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#e6ded0] ${className}`}>
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Subtle Technical Frame Counter (Minimalist Blueprint HUD) */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#292929]/75 text-white text-[9px] font-mono tracking-wider backdrop-blur-[2px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#124ead] animate-pulse" />
        <span>FRAME {currentFrameNum.toString().padStart(3, "0")} / 300</span>
      </div>

      {/* Loading state shimmer if frame 1 is still downloading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f4ebd7] z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5c6470]">
            <span className="w-2 h-2 rounded-full bg-[#124ead] animate-ping" />
            <span>INITIALIZING CINEMATIC SEQUENCE...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FrameSequenceViewer;

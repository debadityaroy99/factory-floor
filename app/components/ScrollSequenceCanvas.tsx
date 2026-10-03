"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollSequenceCanvasProps {
  totalFrames?: number;
  frameDir?: string;
  framePrefix?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ScrollSequenceCanvas({
  totalFrames = 300,
  frameDir = "/frames",
  framePrefix = "frame-",
  className = "",
  children,
}: ScrollSequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation & Frame tracking references
  const currentFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const needsRedrawRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);

  // Image cache: 1-indexed (index 1 to totalFrames)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedFlagsRef = useRef<boolean[]>([]);

  // Debug or progress indicator
  const [loadCount, setLoadCount] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Format frame URL: e.g. /frames/frame-001.jpg
  const getFrameUrl = (index: number) => {
    const padded = index.toString().padStart(3, "0");
    return `${frameDir}/${framePrefix}${padded}.jpg`;
  };

  // Find closest loaded frame if exact target frame is still downloading
  const getClosestLoadedImage = (targetIndex: number): HTMLImageElement | null => {
    const images = imagesRef.current;
    const loaded = loadedFlagsRef.current;

    // Direct hit
    if (loaded[targetIndex] && images[targetIndex]) {
      return images[targetIndex];
    }

    // Search outwards in both directions
    for (let offset = 1; offset < totalFrames; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 1 && loaded[prev] && images[prev]) {
        return images[prev];
      }
      const next = targetIndex + offset;
      if (next <= totalFrames && loaded[next] && images[next]) {
        return images[next];
      }
    }

    return null;
  };

  // Render a specific frame on canvas with retina DPR and "cover" aspect-ratio
  const drawFrameToCanvas = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const img = getClosestLoadedImage(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Ensure physical canvas resolution matches DPR
    const targetWidth = Math.floor(width * dpr);
    const targetHeight = Math.floor(height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Calculate aspect ratio cover math
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

    // High quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image filling the entire canvas
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    ctx.restore();
  };

  // Initialize progressive preloading
  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);

    // Initialize cache arrays
    imagesRef.current = new Array(totalFrames + 1).fill(null);
    loadedFlagsRef.current = new Array(totalFrames + 1).fill(false);

    let isMounted = true;
    let loadedCounter = 0;

    const loadSingleFrame = (idx: number): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
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
          loadedCounter++;
          setLoadCount(loadedCounter);

          // If frame 1 just loaded, immediately paint it!
          if (idx === 1 && lastDrawnFrameRef.current === -1) {
            needsRedrawRef.current = true;
          }
          resolve(img);
        };
        img.onerror = () => {
          // If frame fails, resolve null so sequence continues
          resolve(img);
        };
      });
    };

    // Priority 1: Instant load of initial key frames (1 to 5)
    loadSingleFrame(1).then(() => {
      if (isMounted) {
        drawFrameToCanvas(1);
        needsRedrawRef.current = true;
      }
    });

    // Priority 2: Preload key milestones across the timeline (every 10th frame)
    const keyframes: number[] = [];
    for (let i = 10; i <= totalFrames; i += 10) {
      keyframes.push(i);
    }

    // Priority 3: Progressively buffer all remaining frames in chunks
    const preloadAll = async () => {
      // First, buffer frames 2..15 for immediate scroll responsiveness
      for (let i = 2; i <= Math.min(15, totalFrames); i++) {
        if (!isMounted) return;
        await loadSingleFrame(i);
      }

      // Then load milestone keyframes
      for (const kf of keyframes) {
        if (!isMounted) return;
        await loadSingleFrame(kf);
      }

      // Finally fill all gaps in batched chunks of 5
      const remaining: number[] = [];
      for (let i = 1; i <= totalFrames; i++) {
        if (!loadedFlagsRef.current[i]) remaining.push(i);
      }

      const chunkSize = 5;
      for (let i = 0; i < remaining.length; i += chunkSize) {
        if (!isMounted) return;
        const chunk = remaining.slice(i, i + chunkSize);
        await Promise.all(chunk.map((idx) => loadSingleFrame(idx)));
      }
    };

    preloadAll();

    return () => {
      isMounted = false;
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [totalFrames]);

  // Main scroll tracker and animation loop
  useEffect(() => {
    // Calculate scroll progress from parent container
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;

      if (scrollableDistance <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

      // Map progress [0, 1] directly to frame index [1, totalFrames]
      const target = 1 + progress * (totalFrames - 1);
      targetFrameRef.current = target;
    };

    // Handle window resize & canvas recalculation
    const handleResize = () => {
      handleScroll();
      needsRedrawRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    handleScroll();

    // Persistent animation loop with smooth lerp interpolation
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
        drawFrameToCanvas(frameToDraw);
        lastDrawnFrameRef.current = frameToDraw;
        needsRedrawRef.current = false;
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
  }, [totalFrames, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[450vh] bg-[#0c0d12] ${className}`}
    >
      {/* Sticky Full-Screen Canvas Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden z-0 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-cover"
        />

        {/* Deep Gold / Dark Luxury Ambient Vignette (Seamless edge blending) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
          style={{
            background:
              "radial-gradient(circle at center, transparent 40%, rgba(12, 13, 18, 0.8) 100%)",
          }}
        />

        {/* Subtle Luxury Gold Rim Light Effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            boxShadow: "inset 0 0 120px rgba(212, 175, 55, 0.15)",
          }}
        />
      </div>

      {/* Hero Content pinned / sitting over the canvas */}
      {children && (
        <div className="relative z-10 -mt-[100vh] min-h-screen pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
}

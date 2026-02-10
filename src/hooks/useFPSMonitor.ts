'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Development-only FPS monitoring hook
 *
 * Tracks frames per second using a sliding window approach with requestAnimationFrame.
 * Returns 60 immediately in production to avoid runtime overhead.
 *
 * @returns Current FPS (frames rendered in last 1 second)
 *
 * @example
 * ```tsx
 * function DevFPSOverlay() {
 *   const fps = useFPSMonitor();
 *   return <div>FPS: {fps}</div>;
 * }
 * ```
 */
export function useFPSMonitor(): number {
  // In production, skip all FPS tracking and return 60 immediately
  if (process.env.NODE_ENV !== 'development') {
    return 60;
  }

  const [fps, setFps] = useState(60);
  const frameTimestampsRef = useRef<number[]>([]);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Track frame timestamps in a sliding window
    const trackFrame = (timestamp: number) => {
      const timestamps = frameTimestampsRef.current;

      // Add current frame timestamp
      timestamps.push(timestamp);

      // Remove timestamps older than 1 second (sliding window)
      const oneSecondAgo = timestamp - 1000;
      while (timestamps.length > 0 && timestamps[0] < oneSecondAgo) {
        timestamps.shift();
      }

      // Calculate FPS as number of frames in last 1 second
      const currentFps = timestamps.length;
      setFps(currentFps);

      // Schedule next frame
      rafIdRef.current = requestAnimationFrame(trackFrame);
    };

    // Start tracking
    rafIdRef.current = requestAnimationFrame(trackFrame);

    // Cleanup on unmount
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return fps;
}

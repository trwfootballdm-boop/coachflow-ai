import { useCallback, useEffect, useRef, useState } from 'react';

export function useAnimationPlayback({
  durationMs,
  initialMs = 0,
  speed = 1,
  loop = false,
}) {
  const [currentMs, setCurrentMs] = useState(initialMs);
  const [isPlaying, setIsPlaying] = useState(false);

  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const seek = useCallback((ms) => {
    setCurrentMs(Math.max(0, Math.min(durationMs, ms)));
  }, [durationMs]);

  const tick = useCallback((ts) => {
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const delta = ts - lastTsRef.current;
    lastTsRef.current = ts;

    setCurrentMs((prev) => {
      const next = prev + delta * speedRef.current;
      if (next >= durationMs) {
        if (loop) return 0;
        stop();
        return durationMs;
      }
      return next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, loop, stop]);

  const play = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    currentMs,
    isPlaying,
    play,
    pause,
    stop,
    seek,
    setCurrentMs,
  };
}
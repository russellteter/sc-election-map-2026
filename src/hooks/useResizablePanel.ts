'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const SNAP_POINTS = [320, 384, 560];
const SNAP_THRESHOLD = 24;
const MIN_WIDTH = 240;
const MAX_WIDTH = 768;
const DEFAULT_WIDTH = 384;
const STORAGE_KEY = 'panel-width';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToNearest(width: number): number {
  for (const point of SNAP_POINTS) {
    if (Math.abs(width - point) <= SNAP_THRESHOLD) {
      return point;
    }
  }
  return width;
}

export function useResizablePanel() {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        return parsed;
      }
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const rafIdRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const delta = startXRef.current - e.clientX;
      const newWidth = clamp(startWidthRef.current + delta, MIN_WIDTH, MAX_WIDTH);
      setWidth(newWidth);
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const delta = startXRef.current - e.touches[0].clientX;
      const newWidth = clamp(startWidthRef.current + delta, MIN_WIDTH, MAX_WIDTH);
      setWidth(newWidth);
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    setWidth((current) => {
      const snapped = snapToNearest(current);
      localStorage.setItem(STORAGE_KEY, String(snapped));
      return snapped;
    });

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Trigger Leaflet invalidateSize via resize event
    window.dispatchEvent(new Event('resize'));
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    setIsResizing(false);
    document.body.style.userSelect = '';

    setWidth((current) => {
      const snapped = snapToNearest(current);
      localStorage.setItem(STORAGE_KEY, String(snapped));
      return snapped;
    });

    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);

    window.dispatchEvent(new Event('resize'));
  }, [handleTouchMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startWidthRef.current = width;
    setIsResizing(true);
    document.body.style.userSelect = 'none';

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [width, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    width,
    isResizing,
    handleMouseDown,
    handleTouchStart,
  };
}

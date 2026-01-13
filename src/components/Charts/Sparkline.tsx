'use client';

import { useEffect, useRef } from 'react';

interface SparklineProps {
  values: number[];
  trendPercent: number;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Sparkline component - Mini SVG visualization for election margin trends
 *
 * Features:
 * - Renders 3-5 data points as a line chart
 * - Color based on trend direction (green up, red down, amber neutral)
 * - Endpoint dot highlight
 * - Default size: 48x16px
 * - Respects prefers-reduced-motion
 */
export default function Sparkline({
  values,
  trendPercent,
  width = 48,
  height = 16,
  className = '',
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Color based on trend direction
    const color =
      trendPercent > 20
        ? '#059669' // Green - improving
        : trendPercent < -20
        ? '#DC2626' // Red - declining
        : '#D97706'; // Amber - neutral

    // Normalize values to fit canvas height
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1; // Avoid division by zero

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stepX = width / (values.length - 1);
    const padding = 2; // Padding from edges

    values.forEach((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw endpoint dot
    const lastValue = values[values.length - 1];
    const lastY = height - ((lastValue - min) / range) * (height - padding * 2) - padding;

    ctx.beginPath();
    ctx.arc(width - 1, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Optional: Add subtle shadow to endpoint
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(width - 1, lastY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [values, trendPercent, width, height]);

  // Don't render if insufficient data
  if (values.length < 2) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`sparkline ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-label={`Trend line showing ${values.length} data points with ${trendPercent > 0 ? 'positive' : 'negative'} ${Math.abs(trendPercent).toFixed(1)}% change`}
      role="img"
    />
  );
}

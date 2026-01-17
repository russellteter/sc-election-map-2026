'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllStates, isStateActive, type AnyStateConfig } from '@/lib/stateConfig';
import { BASE_PATH } from '@/lib/constants';

interface USMapProps {
  onStateClick?: (stateCode: string) => void;
  onInactiveStateClick?: (state: AnyStateConfig) => void;
}

// US state paths (simplified for demo - would use full SVG paths in production)
const STATE_PATHS: Record<string, { d: string; x: number; y: number }> = {
  AL: { d: 'M 595 340 l 0 60 l 30 30 l -5 15 l -35 0 l 0 -105 z', x: 582, y: 375 },
  AK: { d: 'M 120 420 l 80 0 l 0 60 l -80 0 z', x: 145, y: 450 },
  AZ: { d: 'M 195 305 l 55 0 l 15 90 l -65 10 l -20 -80 z', x: 212, y: 345 },
  AR: { d: 'M 505 325 l 50 0 l 5 55 l -60 0 z', x: 520, y: 350 },
  CA: { d: 'M 105 200 l 40 5 l 30 110 l -15 70 l -55 -15 l -20 -140 z', x: 120, y: 285 },
  CO: { d: 'M 280 250 l 75 0 l 0 60 l -75 0 z', x: 305, y: 275 },
  CT: { d: 'M 735 185 l 20 0 l 0 15 l -20 5 z', x: 742, y: 190 },
  DE: { d: 'M 710 245 l 10 0 l 0 20 l -10 0 z', x: 712, y: 255 },
  FL: { d: 'M 620 395 l 55 0 l 30 70 l -20 35 l -50 -50 l -15 -55 z', x: 650, y: 430 },
  GA: { d: 'M 620 330 l 45 0 l 15 65 l -60 5 z', x: 635, y: 365 },
  HI: { d: 'M 230 445 l 50 0 l 0 30 l -50 0 z', x: 245, y: 460 },
  ID: { d: 'M 190 115 l 45 0 l 15 100 l -50 15 l -20 -95 z', x: 210, y: 165 },
  IL: { d: 'M 530 215 l 35 0 l 10 90 l -45 5 z', x: 545, y: 265 },
  IN: { d: 'M 565 225 l 30 0 l 0 70 l -30 5 z', x: 575, y: 260 },
  IA: { d: 'M 460 210 l 65 0 l 0 50 l -65 0 z', x: 485, y: 230 },
  KS: { d: 'M 360 270 l 80 0 l 0 50 l -80 0 z', x: 390, y: 290 },
  KY: { d: 'M 560 290 l 65 0 l 5 35 l -75 5 z', x: 590, y: 305 },
  LA: { d: 'M 505 385 l 55 0 l 10 45 l -45 10 l -25 -35 z', x: 530, y: 410 },
  ME: { d: 'M 745 95 l 25 0 l 10 55 l -30 5 l -15 -40 z', x: 760, y: 125 },
  MD: { d: 'M 670 250 l 40 0 l 5 20 l -45 5 z', x: 685, y: 260 },
  MA: { d: 'M 740 165 l 30 0 l 5 15 l -35 5 z', x: 755, y: 175 },
  MI: { d: 'M 545 140 l 50 10 l -5 70 l -50 0 z', x: 565, y: 180 },
  MN: { d: 'M 450 120 l 60 0 l 5 85 l -65 5 z', x: 475, y: 165 },
  MS: { d: 'M 545 340 l 35 0 l 5 75 l -40 5 z', x: 555, y: 380 },
  MO: { d: 'M 470 265 l 60 0 l 10 65 l -75 0 z', x: 495, y: 295 },
  MT: { d: 'M 225 100 l 100 0 l 5 75 l -105 5 z', x: 265, y: 135 },
  NE: { d: 'M 340 215 l 85 0 l 5 50 l -95 5 z', x: 375, y: 240 },
  NV: { d: 'M 155 195 l 45 0 l 15 100 l -55 -10 z', x: 175, y: 250 },
  NH: { d: 'M 740 135 l 15 0 l 5 30 l -20 0 z', x: 745, y: 150 },
  NJ: { d: 'M 715 215 l 15 0 l 0 35 l -15 0 z', x: 720, y: 235 },
  NM: { d: 'M 270 310 l 65 0 l 5 85 l -70 0 z', x: 295, y: 350 },
  NY: { d: 'M 680 150 l 60 0 l 10 55 l -75 10 z', x: 710, y: 180 },
  NC: { d: 'M 625 295 l 80 0 l 5 30 l -90 5 z', x: 665, y: 310 },
  ND: { d: 'M 360 115 l 80 0 l 0 50 l -80 0 z', x: 390, y: 135 },
  OH: { d: 'M 600 220 l 45 0 l 5 55 l -50 5 z', x: 620, y: 250 },
  OK: { d: 'M 355 320 l 90 0 l 5 45 l -95 5 z', x: 395, y: 345 },
  OR: { d: 'M 115 135 l 75 0 l 10 60 l -85 5 z', x: 145, y: 165 },
  PA: { d: 'M 650 200 l 60 0 l 5 40 l -65 5 z', x: 680, y: 225 },
  RI: { d: 'M 745 185 l 10 0 l 0 10 l -10 0 z', x: 748, y: 188 },
  SC: { d: 'M 640 330 l 45 0 l 10 35 l -55 5 z', x: 660, y: 350 },
  SD: { d: 'M 360 165 l 80 0 l 0 50 l -80 0 z', x: 390, y: 185 },
  TN: { d: 'M 545 305 l 85 0 l 5 30 l -95 5 z', x: 585, y: 320 },
  TX: { d: 'M 300 350 l 135 0 l 35 120 l -80 40 l -100 -120 z', x: 380, y: 410 },
  UT: { d: 'M 220 220 l 55 0 l 5 80 l -55 -5 z', x: 240, y: 260 },
  VT: { d: 'M 730 135 l 15 0 l 0 30 l -15 0 z', x: 735, y: 150 },
  VA: { d: 'M 640 265 l 70 0 l 10 35 l -85 10 z', x: 675, y: 285 },
  WA: { d: 'M 130 75 l 70 0 l 10 55 l -80 0 z', x: 160, y: 100 },
  WV: { d: 'M 640 245 l 30 0 l 10 45 l -40 5 z', x: 655, y: 270 },
  WI: { d: 'M 510 145 l 45 0 l 5 65 l -50 5 z', x: 530, y: 180 },
  WY: { d: 'M 260 170 l 75 0 l 0 60 l -75 0 z', x: 290, y: 195 },
  DC: { d: 'M 695 260 l 8 0 l 0 8 l -8 0 z', x: 697, y: 262 },
};

export default function USMap({ onStateClick, onInactiveStateClick }: USMapProps) {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const allStates = getAllStates();

  const handleStateClick = (stateCode: string) => {
    if (isStateActive(stateCode)) {
      onStateClick?.(stateCode);
      router.push(`${BASE_PATH}/${stateCode.toLowerCase()}`);
    } else {
      const state = allStates.find(s => s.code === stateCode);
      if (state) {
        onInactiveStateClick?.(state);
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <svg
        viewBox="0 0 800 500"
        className="w-full h-auto"
        style={{ maxHeight: '60vh' }}
      >
        {/* Background */}
        <rect x="0" y="0" width="800" height="500" fill="transparent" />

        {/* State paths */}
        {Object.entries(STATE_PATHS).map(([code, { d, x, y }]) => {
          const active = isStateActive(code);
          const isHovered = hoveredState === code;

          return (
            <g key={code}>
              <path
                d={d}
                fill={active
                  ? (isHovered ? '#4739E7' : '#6366F1')
                  : (isHovered ? '#94A3B8' : '#CBD5E1')
                }
                stroke={active ? '#3730A3' : '#94A3B8'}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredState(code)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => handleStateClick(code)}
                style={{
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${x}px ${y}px`,
                }}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="500"
                fill={active ? 'white' : '#64748B'}
                className="pointer-events-none select-none"
                style={{ textShadow: active ? '0 1px 2px rgba(0,0,0,0.2)' : 'none' }}
              >
                {code}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredState && (
        <div
          className="absolute glass-surface rounded-lg px-3 py-2 pointer-events-none"
          style={{
            left: '50%',
            bottom: '10px',
            transform: 'translateX(-50%)',
            borderColor: 'var(--class-purple-light)',
          }}
        >
          <span className="font-medium" style={{ color: 'var(--text-color)' }}>
            {allStates.find(s => s.code === hoveredState)?.name}
          </span>
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {isStateActive(hoveredState) ? 'Click to explore' : 'Coming soon'}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#6366F1' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Active States</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#CBD5E1' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

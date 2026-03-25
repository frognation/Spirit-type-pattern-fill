'use client';

import { PatternType } from '@/lib/types';

const PATTERNS: { type: PatternType; label: string }[] = [
  { type: 'pixelMosaic',  label: 'PIXEL'   },
  { type: 'circleArray',  label: 'CIRCLE'  },
  { type: 'checkerboard', label: 'CHECKER' },
  { type: 'stripeFill',   label: 'STRIPE'  },
  { type: 'dotField',     label: 'DOTS'    },
  { type: 'waveChecker',  label: 'WAVE'    },
];

interface Props {
  selected: PatternType;
  onSelect: (t: PatternType) => void;
}

export default function PatternBar({ selected, onSelect }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
      style={{
        background: 'rgba(12,12,12,0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {PATTERNS.map((p) => {
        const active = p.type === selected;
        return (
          <button
            key={p.type}
            onClick={() => onSelect(p.type)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all duration-150 cursor-pointer"
            style={
              active
                ? {
                    border: '1px solid rgba(96,165,250,0.55)',
                    background: 'rgba(96,165,250,0.14)',
                    color: 'rgba(147,197,253,0.9)',
                  }
                : {
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.45)',
                  }
            }
            onMouseEnter={e => {
              if (!active) {
                (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
              }
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

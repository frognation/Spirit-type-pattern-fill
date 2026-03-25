'use client';

import { PatternType } from '@/lib/types';

const PATTERNS: { type: PatternType; label: string }[] = [
  { type: 'pixelMosaic',    label: 'PIXEL'    },
  { type: 'circleArray',    label: 'CIRCLE'   },
  { type: 'checkerboard',   label: 'CHECKER'  },
  { type: 'stripeFill',     label: 'STRIPE'   },
  { type: 'contourChecker', label: 'CONTOUR'  },
  { type: 'outlineCircles', label: 'OUTLINE'  },
  { type: 'blockMosaic',    label: 'BLOCK'    },
  { type: 'ledMatrix',      label: 'LED'      },
  { type: 'vertBars',       label: 'BARS'     },
];

interface Props {
  selected: PatternType;
  onSelect: (t: PatternType) => void;
}

export default function PatternBar({ selected, onSelect }: Props) {
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-2 rounded-xl"
      style={{
        background: 'rgba(10,10,10,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {PATTERNS.map((p) => {
        const active = p.type === selected;
        return (
          <button
            key={p.type}
            onClick={() => onSelect(p.type)}
            className="px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap"
            style={
              active
                ? { border: '1px solid rgba(96,165,250,0.55)', background: 'rgba(96,165,250,0.14)', color: 'rgba(147,197,253,0.95)' }
                : { border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.38)' }
            }
            onMouseEnter={e => { if (!active) { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.22)'; el.style.color = 'rgba(255,255,255,0.65)'; } }}
            onMouseLeave={e => { if (!active) { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.color = 'rgba(255,255,255,0.38)'; } }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PatternOptions, TextConfig, PatternType,
  DEFAULT_PATTERN_OPTIONS, DEFAULT_TEXT_CONFIG, PATTERN_DEFAULTS,
} from '@/lib/types';
import { buildTextMask, generatePattern, renderToCanvas } from '@/lib/patternEngine';
import { exportSVG, downloadSVG } from '@/lib/svgExport';
import Sidebar from './Sidebar';
import PatternBar from './PatternBar';

const CANVAS_W = 900;
const CANVAS_H = 440;

export default function Editor() {
  const [text, setText] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [opts, setOpts] = useState<PatternOptions>(DEFAULT_PATTERN_OPTIONS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderToken = useRef(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const token = ++renderToken.current;
    requestAnimationFrame(() => {
      if (token !== renderToken.current) return;
      document.fonts.ready.then(() => {
        if (token !== renderToken.current) return;
        const mask = buildTextMask(text, CANVAS_W, CANVAS_H);
        const elements = generatePattern(mask, opts);
        renderToCanvas(canvas, elements, opts.bg);
      });
    });
  }, [text, opts]);

  useEffect(() => { render(); }, [render]);

  const selectPattern = useCallback((type: PatternType) => {
    setOpts(prev => ({ ...prev, ...PATTERN_DEFAULTS[type], type }));
  }, []);

  const updateOpts = useCallback((patch: Partial<PatternOptions>) => {
    setOpts(prev => ({ ...prev, ...patch }));
  }, []);

  const updateText = useCallback((patch: Partial<TextConfig>) => {
    setText(prev => ({ ...prev, ...patch }));
  }, []);

  const handleExport = useCallback(() => {
    document.fonts.ready.then(() => {
      const scale = 2;
      const w = CANVAS_W * scale;
      const h = CANVAS_H * scale;
      const scaledOpts = { ...opts, cellSize: opts.cellSize * scale, gap: opts.gap * scale };
      const scaledText = { ...text, fontSize: text.fontSize * scale, letterSpacing: text.letterSpacing * scale };
      const mask = buildTextMask(scaledText, w, h);
      const elements = generatePattern(mask, scaledOpts);
      const svg = exportSVG(elements, w, h, opts.bg);
      const safe = text.text.replace(/[^a-zA-Z0-9]/g, '_');
      downloadSVG(svg, `spirit_${safe}_${opts.type}.svg`);
    });
  }, [opts, text]);

  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ background: '#000' }}>
      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center" style={{ background: '#000' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />

        {/* Floating pattern bar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50">
          <PatternBar selected={opts.type} onSelect={selectPattern} />
        </div>
      </div>

      {/* Right sidebar */}
      <div
        className="shrink-0 flex flex-col overflow-hidden"
        style={{
          width: 272,
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(7,7,7,0.97)',
        }}
      >
        <Sidebar
          opts={opts}
          text={text}
          onUpdateOpts={updateOpts}
          onUpdateText={updateText}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

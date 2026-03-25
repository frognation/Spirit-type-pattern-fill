'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PatternOptions, TextConfig, PatternType, ColorMode,
  DEFAULT_PATTERN_OPTIONS, DEFAULT_TEXT_CONFIG, PATTERN_DEFAULTS,
} from '@/lib/types';
import {
  buildTextMask, generatePattern, renderToCanvas,
} from '@/lib/patternEngine';
import { exportSVG, downloadSVG } from '@/lib/svgExport';
import Sidebar from './Sidebar';
import PatternCanvas from './PatternCanvas';

const CANVAS_W = 900;
const CANVAS_H = 420;

export default function Editor() {
  const [dark, setDark] = useState(true);
  const [text, setText] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [opts, setOpts] = useState<PatternOptions>(DEFAULT_PATTERN_OPTIONS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderToken = useRef(0);

  // Apply dark class to html
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Re-render whenever text or opts change
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

  // Select a pattern type and apply its defaults
  const selectPattern = useCallback((type: PatternType) => {
    setOpts(prev => ({
      ...prev,
      ...PATTERN_DEFAULTS[type],
      type,
    }));
  }, []);

  const updateOpts = useCallback((patch: Partial<PatternOptions>) => {
    setOpts(prev => ({ ...prev, ...patch }));
  }, []);

  const updateText = useCallback((patch: Partial<TextConfig>) => {
    setText(prev => ({ ...prev, ...patch }));
  }, []);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    document.fonts.ready.then(() => {
      // Export at 2x resolution
      const scale = 2;
      const w = CANVAS_W * scale;
      const h = CANVAS_H * scale;
      const scaledOpts = {
        ...opts,
        cellSize: opts.cellSize * scale,
        gap: opts.gap * scale,
      };
      const scaledText = {
        ...text,
        fontSize: text.fontSize * scale,
        letterSpacing: text.letterSpacing * scale,
      };
      const mask = buildTextMask(scaledText, w, h);
      const elements = generatePattern(mask, scaledOpts);
      const svg = exportSVG(elements, w, h, opts.bg);
      const safeText = text.text.replace(/[^a-zA-Z0-9]/g, '_');
      downloadSVG(svg, `spirit_${safeText}_${opts.type}.svg`);
    });
  }, [opts, text]);

  return (
    <div
      className="flex flex-col h-[100dvh] overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-[0.18em] uppercase opacity-90">Spirit</span>
          <span className="text-xs opacity-30 tracking-widest hidden sm:block">Type Pattern Fill</span>
        </div>

        {/* Text input */}
        <input
          value={text.text}
          onChange={e => updateText({ text: e.target.value.toUpperCase() })}
          maxLength={12}
          placeholder="TYPE HERE"
          className="text-center text-lg font-bold tracking-widest uppercase outline-none bg-transparent px-4 py-1 rounded"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-input)',
            color: 'var(--text)',
            width: 260,
            letterSpacing: '0.2em',
          }}
        />

        {/* Dark/Light toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-input)',
            color: 'var(--text)',
          }}
        >
          <span className="text-base">{dark ? '☀' : '◑'}</span>
          {dark ? 'LIGHT' : 'DARK'}
        </button>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-72 shrink-0 flex flex-col overflow-y-auto"
          style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}
        >
          <Sidebar
            opts={opts}
            text={text}
            dark={dark}
            onSelectPattern={selectPattern}
            onUpdateOpts={updateOpts}
            onUpdateText={updateText}
            onExport={handleExport}
          />
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex items-center justify-center overflow-hidden p-6">
          <PatternCanvas canvasRef={canvasRef} width={CANVAS_W} height={CANVAS_H} bg={opts.bg} />
        </main>
      </div>
    </div>
  );
}

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

// ── Image → binary mask ────────────────────────────────────────────────────
function buildImageMask(
  img: HTMLImageElement,
  width: number,
  height: number,
  threshold: number,
  invert: boolean,
): ImageData {
  const off = document.createElement('canvas');
  off.width = width; off.height = height;
  const ctx = off.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight) * 0.9;
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);

  const raw = ctx.getImageData(0, 0, width, height);
  const { data } = raw;

  // Detect alpha channel usage
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 200) { hasAlpha = true; break; }
  }

  const result = new ImageData(width, height);
  const t = threshold; // 0–255
  for (let i = 0; i < data.length; i += 4) {
    let inside: boolean;
    if (hasAlpha) {
      inside = data[i + 3] > t;
    } else {
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      inside = lum < (255 - t);
    }
    const v = (invert ? !inside : inside) ? 255 : 0;
    result.data[i] = result.data[i + 1] = result.data[i + 2] = v;
    result.data[i + 3] = 255;
  }
  return result;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}

// ── Editor ────────────────────────────────────────────────────────────────────

export default function Editor() {
  const [text, setText]   = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [opts, setOpts]   = useState<PatternOptions>(DEFAULT_PATTERN_OPTIONS);
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const renderToken       = useRef(0);

  // Image mask state
  const [imgEl,       setImgEl]       = useState<HTMLImageElement | null>(null);
  const [imgPreview,  setImgPreview]  = useState<string | null>(null);
  const [imgThreshold, setImgThreshold] = useState(80);
  const [imgInvert,   setImgInvert]   = useState(false);

  // ── Render ───────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const token = ++renderToken.current;
    requestAnimationFrame(() => {
      if (token !== renderToken.current) return;
      const go = () => {
        if (token !== renderToken.current) return;
        const mask = imgEl
          ? buildImageMask(imgEl, CANVAS_W, CANVAS_H, imgThreshold, imgInvert)
          : buildTextMask(text, CANVAS_W, CANVAS_H);
        const elements = generatePattern(mask, opts);
        renderToCanvas(canvas, elements, opts.bg);
      };
      if (imgEl) go();
      else document.fonts.ready.then(go);
    });
  }, [text, opts, imgEl, imgThreshold, imgInvert]);

  useEffect(() => { render(); }, [render]);

  // ── Load image from Blob ─────────────────────────────────────────────────
  const loadImage = useCallback(async (blob: Blob) => {
    try {
      const img = await loadImageFromBlob(blob);
      const url = URL.createObjectURL(blob);
      setImgEl(img);
      setImgPreview(url);
    } catch {
      alert('이미지를 불러오지 못했습니다.');
    }
  }, []);

  const clearImage = useCallback(() => {
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgEl(null);
    setImgPreview(null);
  }, [imgPreview]);

  // ── Global paste (Ctrl+V) ────────────────────────────────────────────────
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) { loadImage(blob); e.preventDefault(); }
          break;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [loadImage]);

  // ── Pattern / text helpers ───────────────────────────────────────────────
  const selectPattern = useCallback((type: PatternType) => {
    setOpts(prev => ({ ...prev, ...PATTERN_DEFAULTS[type], type }));
  }, []);

  const updateOpts = useCallback((patch: Partial<PatternOptions>) => {
    setOpts(prev => ({ ...prev, ...patch }));
  }, []);

  const updateText = useCallback((patch: Partial<TextConfig>) => {
    setText(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const doExport = () => {
      const scale = 2;
      const w = CANVAS_W * scale, h = CANVAS_H * scale;
      const scaledOpts = { ...opts, cellSize: opts.cellSize * scale, gap: opts.gap * scale };
      const mask = imgEl
        ? buildImageMask(imgEl, w, h, imgThreshold, imgInvert)
        : buildTextMask(
            { ...text, fontSize: text.fontSize * scale, letterSpacing: text.letterSpacing * scale },
            w, h,
          );
      const elements = generatePattern(mask, scaledOpts);
      const svg = exportSVG(elements, w, h, opts.bg);
      const name = imgEl ? 'image' : text.text.replace(/[^a-zA-Z0-9]/g, '_');
      downloadSVG(svg, `spirit_${name}_${opts.type}.svg`);
    };
    if (imgEl) doExport();
    else document.fonts.ready.then(doExport);
  }, [opts, text, imgEl, imgThreshold, imgInvert]);

  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ background: '#000' }}>
      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center" style={{ background: '#000' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50">
          <PatternBar selected={opts.type} onSelect={selectPattern} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="shrink-0 flex flex-col overflow-hidden"
        style={{ width: 272, borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(7,7,7,0.97)' }}>
        <Sidebar
          opts={opts} text={text}
          imgPreview={imgPreview}
          imgThreshold={imgThreshold}
          imgInvert={imgInvert}
          onUpdateOpts={updateOpts}
          onUpdateText={updateText}
          onImageLoad={loadImage}
          onImageClear={clearImage}
          onImgThreshold={setImgThreshold}
          onImgInvert={setImgInvert}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

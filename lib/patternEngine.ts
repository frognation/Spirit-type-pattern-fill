import { PatternOptions, PatternElement, TextConfig } from './types';

// ─── Text Mask ────────────────────────────────────────────────────────────────

let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;

export function buildTextMask(
  textCfg: TextConfig,
  width: number,
  height: number
): ImageData {
  if (!maskCanvas) {
    maskCanvas = document.createElement('canvas');
    maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
  }
  maskCanvas.width = width;
  maskCanvas.height = height;

  const ctx = maskCtx!;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  const font = `${textCfg.fontWeight} ${textCfg.fontSize}px ${textCfg.fontFamily}`;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply letter spacing via manual glyph positioning
  if (textCfg.letterSpacing !== 0) {
    const chars = textCfg.text.split('');
    const totalWidth = chars.reduce((acc, ch) => acc + ctx.measureText(ch).width + textCfg.letterSpacing, 0) - textCfg.letterSpacing;
    let x = (width - totalWidth) / 2;
    const y = height / 2;
    for (const ch of chars) {
      ctx.fillText(ch, x + ctx.measureText(ch).width / 2, y);
      x += ctx.measureText(ch).width + textCfg.letterSpacing;
    }
  } else {
    ctx.fillText(textCfg.text, width / 2, height / 2);
  }

  return ctx.getImageData(0, 0, width, height);
}

export function isInside(mask: ImageData, x: number, y: number): boolean {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= mask.width || iy >= mask.height) return false;
  return mask.data[(iy * mask.width + ix) * 4] > 64;
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Pattern Generators ───────────────────────────────────────────────────────

export function generatePattern(
  mask: ImageData,
  opts: PatternOptions
): PatternElement[] {
  switch (opts.type) {
    case 'pixelMosaic': return genPixelMosaic(mask, opts);
    case 'circleArray': return genCircleArray(mask, opts);
    case 'checkerboard': return genCheckerboard(mask, opts);
    case 'stripeFill': return genStripeFill(mask, opts);
    case 'dotField': return genDotField(mask, opts);
    case 'waveChecker': return genWaveChecker(mask, opts);
    default: return [];
  }
}

function pickColor(colors: string[], index: number, rng: () => number, randomize: boolean): string {
  if (randomize) return colors[Math.floor(rng() * colors.length)];
  return colors[index % colors.length];
}

// Pixel Mosaic: grid of small squares
function genPixelMosaic(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, roundness, hexGrid, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(42);
  const elements: PatternElement[] = [];
  const rx = roundness * (cellSize / 2);
  const sz = cellSize - gap;

  for (let row = 0; ; row++) {
    const yBase = row * cellSize;
    if (yBase >= height) break;
    for (let col = 0; ; col++) {
      const xOff = hexGrid && row % 2 === 1 ? cellSize / 2 : 0;
      const xBase = col * cellSize + xOff;
      if (xBase >= width + cellSize) break;
      const cx = xBase + cellSize / 2;
      const cy = yBase + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      const idx = randomize ? 0 : (row + col);
      elements.push({
        kind: 'rect',
        x: xBase + gap / 2,
        y: yBase + gap / 2,
        w: sz,
        h: sz,
        rx,
        color: pickColor(colors, idx, rng, randomize),
      });
    }
  }
  return elements;
}

// Circle Array: circles in a grid
function genCircleArray(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, hexGrid, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(99);
  const elements: PatternElement[] = [];
  const r = cellSize / 2 - gap;

  for (let row = 0; ; row++) {
    const yBase = row * cellSize;
    if (yBase >= height) break;
    for (let col = 0; ; col++) {
      const xOff = hexGrid && row % 2 === 1 ? cellSize / 2 : 0;
      const cx = col * cellSize + cellSize / 2 + xOff;
      if (cx > width + cellSize) break;
      const cy = yBase + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      const idx = randomize ? 0 : (row + col);
      elements.push({
        kind: 'circle',
        cx,
        cy,
        r: Math.max(1, r),
        color: pickColor(colors, idx, rng, randomize),
      });
    }
  }
  return elements;
}

// Checkerboard: alternating squares clipped to text
function genCheckerboard(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, colors } = opts;
  const { width, height } = mask;
  const elements: PatternElement[] = [];

  for (let row = 0; ; row++) {
    const y = row * cellSize;
    if (y >= height) break;
    for (let col = 0; ; col++) {
      const x = col * cellSize;
      if (x >= width) break;
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      const colorIdx = (row + col) % 2;
      elements.push({
        kind: 'rect',
        x,
        y,
        w: cellSize,
        h: cellSize,
        rx: 0,
        color: colors[colorIdx % colors.length],
      });
    }
  }
  return elements;
}

// Stripe Fill: horizontal stripes scanning text boundary
function genStripeFill(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors } = opts;
  const { width, height } = mask;
  const elements: PatternElement[] = [];
  const stripeH = cellSize - (gap > 0 ? 1 : 0);

  for (let row = 0; ; row++) {
    const y = row * cellSize;
    if (y >= height) break;
    const cy = y + cellSize / 2;
    const colorIdx = row % colors.length;
    const color = colors[colorIdx];

    // Scan for contiguous runs inside text
    let runStart = -1;
    for (let x = 0; x <= width; x++) {
      const inside = x < width ? isInside(mask, x, cy) : false;
      if (inside && runStart < 0) {
        runStart = x;
      } else if (!inside && runStart >= 0) {
        elements.push({
          kind: 'rect',
          x: runStart,
          y,
          w: x - runStart,
          h: stripeH,
          rx: 0,
          color,
        });
        runStart = -1;
      }
    }
  }
  return elements;
}

// Dot Field: dots of varying size based on position
function genDotField(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, hexGrid, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(7);
  const elements: PatternElement[] = [];
  const baseR = cellSize / 2 - gap;

  for (let row = 0; ; row++) {
    const yBase = row * cellSize;
    if (yBase >= height) break;
    for (let col = 0; ; col++) {
      const xOff = hexGrid && row % 2 === 1 ? cellSize / 2 : 0;
      const cx = col * cellSize + cellSize / 2 + xOff;
      if (cx > width + cellSize) break;
      const cy = yBase + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      const scaleFactor = randomize ? 0.5 + rng() * 0.7 : 1;
      const r = Math.max(1, baseR * scaleFactor);
      const idx = randomize ? 0 : (row + col);
      elements.push({
        kind: 'circle',
        cx,
        cy,
        r,
        color: pickColor(colors, idx, rng, randomize),
      });
    }
  }
  return elements;
}

// Wave Checker: checkerboard with wave distortion
function genWaveChecker(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, colors, waveIntensity } = opts;
  const { width, height } = mask;
  const elements: PatternElement[] = [];
  const amp = cellSize * waveIntensity;

  for (let row = 0; ; row++) {
    const y = row * cellSize;
    if (y >= height) break;
    for (let col = 0; ; col++) {
      const waveX = amp * Math.sin((row * 0.7) + col * 0.3);
      const waveY = amp * Math.cos((col * 0.7) + row * 0.3);
      const x = col * cellSize + waveX;
      if (x > width + cellSize * 2) break;
      const cy = y + cellSize / 2 + waveY;
      const cx = x + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      const colorIdx = (row + col) % 2;
      elements.push({
        kind: 'rect',
        x,
        y: y + waveY,
        w: cellSize,
        h: cellSize,
        rx: 0,
        color: colors[colorIdx % colors.length],
      });
    }
  }
  return elements;
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  if (r <= 0) { ctx.fillRect(x, y, w, h); return; }
  const rr = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rr);
    ctx.fill();
  } else {
    // Fallback for older browsers
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
    ctx.fill();
  }
}

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  elements: PatternElement[],
  bg: string
) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const el of elements) {
    ctx.fillStyle = el.color;
    if (el.kind === 'rect') {
      fillRoundRect(ctx, el.x, el.y, el.w, el.h, el.rx);
    } else {
      ctx.beginPath();
      ctx.arc(el.cx, el.cy, el.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

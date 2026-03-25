import { PatternOptions, PatternElement, TextConfig } from './types';

// ─── Text Mask ────────────────────────────────────────────────────────────────

let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;

export function buildTextMask(cfg: TextConfig, width: number, height: number): ImageData {
  if (!maskCanvas) {
    maskCanvas = document.createElement('canvas');
    maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
  }
  maskCanvas.width = width;
  maskCanvas.height = height;
  const ctx = maskCtx!;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = `${cfg.fontWeight} ${cfg.fontSize}px ${cfg.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (cfg.letterSpacing !== 0) {
    const chars = cfg.text.split('');
    const charWidths = chars.map(ch => ctx.measureText(ch).width);
    const totalW = charWidths.reduce((a, w) => a + w + cfg.letterSpacing, 0) - cfg.letterSpacing;
    let x = (width - totalW) / 2;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x + charWidths[i] / 2, height / 2);
      x += charWidths[i] + cfg.letterSpacing;
    }
  } else {
    ctx.fillText(cfg.text, width / 2, height / 2);
  }
  return ctx.getImageData(0, 0, width, height);
}

export function isInside(mask: ImageData, x: number, y: number): boolean {
  const ix = Math.round(x), iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= mask.width || iy >= mask.height) return false;
  return mask.data[(iy * mask.width + ix) * 4] > 64;
}

// ─── Distance Field (BFS Manhattan) ──────────────────────────────────────────

function computeDistField(mask: ImageData): Uint16Array {
  const { width, height, data } = mask;
  const dist = new Uint16Array(width * height).fill(65535);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;

  for (let i = 0; i < width * height; i++) {
    if (data[i * 4] <= 64) { dist[i] = 0; queue[tail++] = i; }
  }
  while (head < tail) {
    const idx = queue[head++];
    const d1 = dist[idx] + 1;
    const x = idx % width, y = (idx / width) | 0;
    if (x > 0          && d1 < dist[idx-1])     { dist[idx-1]     = d1; queue[tail++] = idx-1;     }
    if (x < width-1    && d1 < dist[idx+1])     { dist[idx+1]     = d1; queue[tail++] = idx+1;     }
    if (y > 0          && d1 < dist[idx-width]) { dist[idx-width] = d1; queue[tail++] = idx-width; }
    if (y < height-1   && d1 < dist[idx+width]) { dist[idx+width] = d1; queue[tail++] = idx+width; }
  }
  return dist;
}

function distAt(dist: Uint16Array, w: number, h: number, x: number, y: number): number {
  const ix = Math.max(0, Math.min(w-1, Math.round(x)));
  const iy = Math.max(0, Math.min(h-1, Math.round(y)));
  return dist[iy * w + ix];
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Canvas renderer ─────────────────────────────────────────────────────────

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (r <= 0) { ctx.fillRect(x, y, w, h); return; }
  const rr = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);   ctx.arcTo(x + w, y,     x + w, y + rr,   rr);
    ctx.lineTo(x + w, y + h - rr); ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);   ctx.arcTo(x,     y + h, x,     y + h - rr, rr);
    ctx.lineTo(x, y + rr);       ctx.arcTo(x,     y,     x + rr, y,     rr);
    ctx.closePath(); ctx.fill();
  }
}

export function renderToCanvas(canvas: HTMLCanvasElement, elements: PatternElement[], bg: string) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const el of elements) {
    ctx.fillStyle = el.color;
    if (el.kind === 'rect') {
      fillRoundRect(ctx, el.x, el.y, el.w, el.h, el.rx);
    } else {
      ctx.beginPath(); ctx.arc(el.cx, el.cy, el.r, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ─── Pattern dispatcher ───────────────────────────────────────────────────────

export function generatePattern(mask: ImageData, opts: PatternOptions): PatternElement[] {
  switch (opts.type) {
    case 'pixelMosaic':    return genPixelMosaic(mask, opts);
    case 'circleArray':    return genCircleArray(mask, opts);
    case 'checkerboard':   return genCheckerboard(mask, opts);
    case 'stripeFill':     return genStripeFill(mask, opts);
    case 'contourChecker': return genContourChecker(mask, opts);
    case 'outlineCircles': return genOutlineCircles(mask, opts);
    case 'blockMosaic':    return genBlockMosaic(mask, opts);
    case 'ledMatrix':      return genLedMatrix(mask, opts);
    case 'vertBars':       return genVertBars(mask, opts);
    default: return [];
  }
}

function pickColor(colors: string[], idx: number, rng: () => number, rand: boolean) {
  return colors[(rand ? Math.floor(rng() * colors.length) : Math.abs(idx)) % colors.length];
}

// ─── 1. Pixel Mosaic ──────────────────────────────────────────────────────────

function genPixelMosaic(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, roundness, hexGrid, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(42);
  const sz = cellSize - gap;
  const rx = roundness * (sz / 2);
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    const yBase = row * cellSize;
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const xOff = hexGrid && row % 2 === 1 ? cellSize / 2 : 0;
      const cx = col * cellSize + cellSize / 2 + xOff;
      const cy = yBase + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      els.push({ kind: 'rect', x: cx - sz/2, y: cy - sz/2, w: sz, h: sz, rx, color: pickColor(colors, row + col, rng, randomize) });
    }
  }
  return els;
}

// ─── 2. Circle Array ──────────────────────────────────────────────────────────

function genCircleArray(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, hexGrid, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(99);
  const r = Math.max(1, cellSize / 2 - gap);
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const xOff = hexGrid && row % 2 === 1 ? cellSize / 2 : 0;
      const cx = col * cellSize + cellSize / 2 + xOff;
      const cy = row * cellSize + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      els.push({ kind: 'circle', cx, cy, r, color: pickColor(colors, row + col, rng, randomize) });
    }
  }
  return els;
}

// ─── 3. Checkerboard ─────────────────────────────────────────────────────────

function genCheckerboard(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, colors } = opts;
  const { width, height } = mask;
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const x = col * cellSize, y = row * cellSize;
      if (!isInside(mask, x + cellSize / 2, y + cellSize / 2)) continue;
      const colorIdx = (row + col) % 2;
      els.push({ kind: 'rect', x, y, w: cellSize, h: cellSize, rx: 0, color: colors[colorIdx % colors.length] });
    }
  }
  return els;
}

// ─── 4. Stripe Fill ───────────────────────────────────────────────────────────

function genStripeFill(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors } = opts;
  const { width, height } = mask;
  const els: PatternElement[] = [];
  const stripeH = Math.max(1, cellSize - (gap > 0 ? 1 : 0));

  for (let row = 0; row * cellSize < height; row++) {
    const y = row * cellSize;
    const cy = y + cellSize / 2;
    const color = colors[row % colors.length];
    let runStart = -1;
    for (let x = 0; x <= width; x++) {
      const inside = x < width ? isInside(mask, x, cy) : false;
      if (inside && runStart < 0) runStart = x;
      else if (!inside && runStart >= 0) {
        els.push({ kind: 'rect', x: runStart, y, w: x - runStart, h: stripeH, rx: 0, color });
        runStart = -1;
      }
    }
  }
  return els;
}

// ─── 5. Contour Checker ───────────────────────────────────────────────────────
// Uses distance field gradient to locally rotate checker coordinates,
// making the pattern flow along the stroke contour of each letter.

function genContourChecker(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, strokeDepth } = opts;
  const { width, height } = mask;
  const dist = computeDistField(mask);
  const sz = Math.max(1, cellSize - gap);
  const smoothR = Math.max(2, Math.round(cellSize * (0.3 + strokeDepth * 0.5)));
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;

      // Smoothed gradient of distance field
      let gx = 0, gy = 0;
      for (let dy = -smoothR; dy <= smoothR; dy += 2) {
        for (let dx = -smoothR; dx <= smoothR; dx += 2) {
          if (dx * dx + dy * dy > smoothR * smoothR * 1.1) continue;
          const w = Math.exp(-(dx*dx + dy*dy) / (smoothR * smoothR * 0.5));
          gx += w * (distAt(dist, width, height, cx+dx+1, cy+dy) - distAt(dist, width, height, cx+dx-1, cy+dy)) / 2;
          gy += w * (distAt(dist, width, height, cx+dx, cy+dy+1) - distAt(dist, width, height, cx+dx, cy+dy-1)) / 2;
        }
      }
      const mag = Math.sqrt(gx*gx + gy*gy);

      let u: number, v: number;
      if (mag > 0.5) {
        const nx = gx / mag, ny = gy / mag; // across-stroke direction
        u = cx * nx + cy * ny;              // across stroke ≈ dist value
        v = cx * (-ny) + cy * nx;           // along stroke (perpendicular)
      } else {
        u = cx; v = cy;
      }

      const colorIdx = (Math.floor(u / cellSize) + Math.floor(v / cellSize)) & 1;
      els.push({ kind: 'rect', x: cx - sz/2, y: cy - sz/2, w: sz, h: sz, rx: 0, color: colors[colorIdx % colors.length] });
    }
  }
  return els;
}

// ─── 6. Outline Circles ───────────────────────────────────────────────────────
// Places circles only within the stroke region (near letter boundary).

function genOutlineCircles(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, hexGrid, strokeDepth } = opts;
  const { width, height } = mask;
  const dist = computeDistField(mask);
  const r = Math.max(1, cellSize / 2 - gap);
  const maxDist = cellSize * (1 + strokeDepth * 4);
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const xOff = hexGrid && row % 2 === 1 ? cellSize / 2 : 0;
      const cx = col * cellSize + cellSize / 2 + xOff;
      const cy = row * cellSize + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;
      if (distAt(dist, width, height, cx, cy) > maxDist) continue;
      const colorIdx = (row + col) % colors.length;
      els.push({ kind: 'circle', cx, cy, r, color: colors[colorIdx] });
    }
  }
  return els;
}

// ─── 7. Block Mosaic ─────────────────────────────────────────────────────────
// Large flat-color blocks with pixel-stepped edges — illustration style.

function genBlockMosaic(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, colors, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(77);
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    const y = row * cellSize;
    // Merge adjacent same-colored cells horizontally for block feel
    let runStart = -1;
    let runColor = '';
    const flush = (endCol: number) => {
      if (runStart >= 0) {
        const x = runStart * cellSize;
        const w = (endCol - runStart) * cellSize;
        els.push({ kind: 'rect', x, y, w, h: cellSize, rx: 0, color: runColor });
      }
    };
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const cx = col * cellSize + cellSize / 2;
      const cy = y + cellSize / 2;
      if (isInside(mask, cx, cy)) {
        const color = pickColor(colors, row * 1000 + col, rng, randomize);
        if (runStart < 0) { runStart = col; runColor = color; }
        else if (color !== runColor || (rng() < 0.15)) { flush(col); runStart = col; runColor = color; }
      } else {
        flush(col); runStart = -1;
      }
    }
    flush(Math.ceil(width / cellSize) + 1);
  }
  return els;
}

// ─── 8. LED Matrix ────────────────────────────────────────────────────────────
// Dense grid of small symbols (mix of squares and circles), neon colors.

function genLedMatrix(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, gap, colors, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(13);
  const sz = Math.max(1, cellSize - gap);
  const rx = opts.roundness * (sz / 2);
  const els: PatternElement[] = [];

  for (let row = 0; row * cellSize < height + cellSize; row++) {
    for (let col = 0; col * cellSize < width + cellSize; col++) {
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;
      if (!isInside(mask, cx, cy)) continue;

      const color = pickColor(colors, row + col, rng, randomize);
      // Randomly pick shape: 0=square, 1=circle, 2=small square (accent)
      const shapeType = Math.floor(rng() * 3);
      const scaleFactor = shapeType === 2 ? 0.5 : 0.9;

      if (shapeType === 1) {
        els.push({ kind: 'circle', cx, cy, r: (sz * scaleFactor) / 2, color });
      } else {
        const s = sz * scaleFactor;
        els.push({ kind: 'rect', x: cx - s/2, y: cy - s/2, w: s, h: s, rx: shapeType === 2 ? 0 : rx, color });
      }
    }
  }
  return els;
}

// ─── 9. Vertical Bars ────────────────────────────────────────────────────────
// Vertical colored bar segments within the letter — scanline / data viz style.

function genVertBars(mask: ImageData, opts: PatternOptions): PatternElement[] {
  const { cellSize, colors, randomize } = opts;
  const { width, height } = mask;
  const rng = seededRng(55);
  const els: PatternElement[] = [];

  for (let x = 0; x < width; x += cellSize) {
    const sampleX = x + cellSize / 2;
    let inRun = false, runStart = 0;

    for (let y = 0; y <= height; y++) {
      const inside = y < height ? isInside(mask, sampleX, y) : false;
      if (inside && !inRun) { runStart = y; inRun = true; }
      else if (!inside && inRun) {
        // Segment this column run into vertical bar chunks
        for (let segY = runStart; segY < y; segY += cellSize) {
          const segH = Math.min(cellSize, y - segY);
          els.push({ kind: 'rect', x, y: segY, w: cellSize, h: segH, rx: 0, color: pickColor(colors, 0, rng, randomize) });
        }
        inRun = false;
      }
    }
  }
  return els;
}

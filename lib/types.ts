export type PatternType =
  | 'pixelMosaic'    // small colored grid squares
  | 'circleArray'    // circle grid fill
  | 'checkerboard'   // alternating large squares
  | 'stripeFill'     // horizontal stripes
  | 'contourChecker' // checker conforming to stroke contour
  | 'outlineCircles' // circles along stroke outline only
  | 'blockMosaic'    // large flat-color pixel blocks (illustration style)
  | 'ledMatrix'      // dense LED/cross-stitch dot matrix
  | 'vertBars';      // vertical bar chart scanlines

export type ColorMode = 'mono' | 'dual' | 'tri' | 'multi';

export interface PatternOptions {
  type: PatternType;
  cellSize: number;       // element size in px (4–64)
  gap: number;            // gap between elements (0–12)
  colorMode: ColorMode;
  colors: string[];
  bg: string;
  roundness: number;      // 0 = square, 1 = circle
  hexGrid: boolean;       // hex offset for circle/pixel patterns
  strokeDepth: number;    // 0–1, used by outlineCircles / contourChecker smoothing
  randomize: boolean;
}

export interface TextConfig {
  text: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  letterSpacing: number;
}

export type PatternElement =
  | { kind: 'rect';   x: number; y: number; w: number; h: number; rx: number; color: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; color: string };

export const PATTERN_DEFAULTS: Record<PatternType, Partial<PatternOptions>> = {
  pixelMosaic: {
    cellSize: 10, gap: 1, colorMode: 'multi',
    colors: ['#FF2D78','#00CC66','#FFCC00','#FF6B00','#0066FF','#CC0044'],
    bg: '#0a0a0a', roundness: 0.1, hexGrid: false, randomize: true, strokeDepth: 0,
  },
  circleArray: {
    cellSize: 36, gap: 4, colorMode: 'dual',
    colors: ['#4488FF','#ffffff'],
    bg: '#0a0a0a', roundness: 1, hexGrid: true, randomize: false, strokeDepth: 0,
  },
  checkerboard: {
    cellSize: 64, gap: 0, colorMode: 'dual',
    colors: ['#2ECC71','#111111'],
    bg: '#ffffff', roundness: 0, hexGrid: false, randomize: false, strokeDepth: 0,
  },
  stripeFill: {
    cellSize: 14, gap: 2, colorMode: 'dual',
    colors: ['#FF2D9E','#1a3320'],
    bg: '#f0ede6', roundness: 0, hexGrid: false, randomize: false, strokeDepth: 0,
  },
  contourChecker: {
    cellSize: 28, gap: 1, colorMode: 'dual',
    colors: ['#4488EE','#ffffff'],
    bg: '#CC2200', roundness: 0, hexGrid: false, randomize: false, strokeDepth: 0.4,
  },
  outlineCircles: {
    cellSize: 36, gap: 3, colorMode: 'mono',
    colors: ['#4488FF'],
    bg: '#0a0a0a', roundness: 1, hexGrid: false, randomize: false, strokeDepth: 0.4,
  },
  blockMosaic: {
    cellSize: 28, gap: 0, colorMode: 'multi',
    colors: ['#C8A882','#8B6347','#3A7D44','#E8C84A','#D45B3A','#7AAAC8','#C878A0','#888888'],
    bg: '#ffffff', roundness: 0, hexGrid: false, randomize: true, strokeDepth: 0,
  },
  ledMatrix: {
    cellSize: 7, gap: 1, colorMode: 'multi',
    colors: ['#FF2D78','#00FF66','#FFCC00','#FF6B00','#0088FF','#FF00FF'],
    bg: '#000000', roundness: 0.2, hexGrid: false, randomize: true, strokeDepth: 0,
  },
  vertBars: {
    cellSize: 5, gap: 0, colorMode: 'multi',
    colors: ['#FF2200','#00FF44','#FFCC00','#FF8800','#00CCFF','#222222'],
    bg: '#000000', roundness: 0, hexGrid: false, randomize: true, strokeDepth: 0,
  },
};

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  text: 'SPIRIT',
  fontSize: 220,
  fontWeight: '900',
  fontFamily: 'ui-monospace, monospace',
  letterSpacing: -4,
};

export const DEFAULT_PATTERN_OPTIONS: PatternOptions = {
  type: 'pixelMosaic',
  cellSize: 10, gap: 1, colorMode: 'multi',
  colors: ['#FF2D78','#00CC66','#FFCC00','#FF6B00','#0066FF','#CC0044'],
  bg: '#0a0a0a', roundness: 0.1, hexGrid: false, strokeDepth: 0, randomize: true,
};

export type PatternType =
  | 'pixelMosaic'   // grid of small squares (img 1 style)
  | 'circleArray'   // grid of circles (img 2 style)
  | 'checkerboard'  // alternating squares (img 3 style)
  | 'stripeFill'    // horizontal stripes (img 4 style)
  | 'dotField'      // scattered dots of varying size
  | 'waveChecker';  // warped checkerboard (img 6 style)

export type ColorMode = 'mono' | 'dual' | 'tri' | 'multi';

export interface PatternOptions {
  type: PatternType;
  cellSize: number;       // element size in px (4–64)
  gap: number;            // gap between elements (0–12)
  colorMode: ColorMode;
  colors: string[];       // hex color values
  bg: string;             // background color
  roundness: number;      // 0 = square, 1 = circle (for rect-based patterns)
  hexGrid: boolean;       // hex offset for circle/pixel patterns
  waveIntensity: number;  // 0–1, for waveChecker
  randomize: boolean;     // randomize color assignment
}

export interface TextConfig {
  text: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  letterSpacing: number;
}

export type PatternElement =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx: number; color: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; color: string };

export const PATTERN_DEFAULTS: Record<PatternType, Partial<PatternOptions>> = {
  pixelMosaic: {
    cellSize: 10,
    gap: 1,
    colorMode: 'multi',
    colors: ['#FF2D78', '#00CC66', '#FFCC00', '#FF6B00', '#0066FF', '#CC0044'],
    bg: '#0a0a0a',
    roundness: 0.1,
    hexGrid: false,
    randomize: true,
    waveIntensity: 0,
  },
  circleArray: {
    cellSize: 36,
    gap: 4,
    colorMode: 'dual',
    colors: ['#4488FF', '#ffffff'],
    bg: '#0a0a0a',
    roundness: 1,
    hexGrid: true,
    randomize: false,
    waveIntensity: 0,
  },
  checkerboard: {
    cellSize: 40,
    gap: 0,
    colorMode: 'dual',
    colors: ['#2ECC71', '#0a0a0a'],
    bg: '#f5f5f0',
    roundness: 0,
    hexGrid: false,
    randomize: false,
    waveIntensity: 0,
  },
  stripeFill: {
    cellSize: 14,
    gap: 2,
    colorMode: 'dual',
    colors: ['#FF2D9E', '#1a3320'],
    bg: '#f0ede6',
    roundness: 0,
    hexGrid: false,
    randomize: false,
    waveIntensity: 0,
  },
  dotField: {
    cellSize: 20,
    gap: 3,
    colorMode: 'dual',
    colors: ['#ffffff', '#888888'],
    bg: '#111111',
    roundness: 1,
    hexGrid: true,
    randomize: true,
    waveIntensity: 0,
  },
  waveChecker: {
    cellSize: 32,
    gap: 0,
    colorMode: 'dual',
    colors: ['#4488EE', '#ffffff'],
    bg: '#CC2200',
    roundness: 0,
    hexGrid: false,
    randomize: false,
    waveIntensity: 0.5,
  },
};

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  text: 'SPIRIT',
  fontSize: 220,
  fontWeight: '900',
  fontFamily: 'Inter, Arial Black, sans-serif',
  letterSpacing: -4,
};

export const DEFAULT_PATTERN_OPTIONS: PatternOptions = {
  type: 'pixelMosaic',
  cellSize: 10,
  gap: 1,
  colorMode: 'multi',
  colors: ['#FF2D78', '#00CC66', '#FFCC00', '#FF6B00', '#0066FF', '#CC0044'],
  bg: '#0a0a0a',
  roundness: 0.1,
  hexGrid: false,
  waveIntensity: 0,
  randomize: true,
};

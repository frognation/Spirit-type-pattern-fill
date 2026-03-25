'use client';

import { PatternOptions, TextConfig, PatternType, ColorMode } from '@/lib/types';

const PATTERN_LIST: { type: PatternType; label: string; icon: string; desc: string }[] = [
  { type: 'pixelMosaic',  label: 'Pixel',    icon: '▪', desc: 'Colored grid squares' },
  { type: 'circleArray',  label: 'Circle',   icon: '●', desc: 'Dot / circle grid' },
  { type: 'checkerboard', label: 'Checker',  icon: '◼', desc: 'Alternating squares' },
  { type: 'stripeFill',   label: 'Stripe',   icon: '≡', desc: 'Horizontal stripes' },
  { type: 'dotField',     label: 'Dots',     icon: '⋯', desc: 'Scattered dot field' },
  { type: 'waveChecker',  label: 'Wave',     icon: '〰', desc: 'Warped checkerboard' },
];

const FONT_LIST = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", Courier, monospace' },
  { label: 'Arial Black', value: '"Arial Black", Gadget, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
];

const COLOR_PRESETS: Record<PatternType, string[][]> = {
  pixelMosaic: [
    ['#FF2D78','#00CC66','#FFCC00','#FF6B00','#0066FF','#CC0044'],
    ['#FF0080','#00FFCC','#FFFF00','#FF8800'],
    ['#FFFFFF','#CCCCCC','#888888','#444444'],
    ['#FF6B6B','#FFE66D','#A8E063','#56CCF2'],
  ],
  circleArray: [
    ['#4488FF','#ffffff'],
    ['#FF2D78','#FFE8F0'],
    ['#00CC66','#001a0d'],
    ['#FFCC00','#1a1000'],
  ],
  checkerboard: [
    ['#2ECC71','#0a0a0a'],
    ['#FF2D78','#f5f5f0'],
    ['#4488FF','#0a0a0a'],
    ['#FFCC00','#1a1000'],
  ],
  stripeFill: [
    ['#FF2D9E','#1a3320'],
    ['#4488FF','#0a0a0a'],
    ['#FFCC00','#1a1000'],
    ['#FF2D78','#2D0020'],
  ],
  dotField: [
    ['#ffffff','#444444'],
    ['#FF2D78','#2D0020'],
    ['#00CC66','#001a0d'],
    ['#FFCC00','#1a1000'],
  ],
  waveChecker: [
    ['#4488EE','#ffffff'],
    ['#FF2D78','#ffffff'],
    ['#00CC66','#ffffff'],
    ['#FFCC00','#ffffff'],
  ],
};

interface Props {
  opts: PatternOptions;
  text: TextConfig;
  dark: boolean;
  onSelectPattern: (t: PatternType) => void;
  onUpdateOpts: (p: Partial<PatternOptions>) => void;
  onUpdateText: (p: Partial<TextConfig>) => void;
  onExport: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SliderRow({
  label, value, min, max, step = 1, onChange, unit = '',
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="text-xs w-8 text-right font-mono shrink-0" style={{ color: 'var(--text)' }}>
        {value}{unit}
      </span>
    </div>
  );
}

export default function Sidebar({ opts, text, onSelectPattern, onUpdateOpts, onUpdateText, onExport }: Props) {
  const presets = COLOR_PRESETS[opts.type];

  const updateColor = (i: number, val: string) => {
    const colors = [...opts.colors];
    colors[i] = val;
    onUpdateOpts({ colors });
  };

  const setColorMode = (mode: ColorMode) => {
    const count = { mono: 1, dual: 2, tri: 3, multi: 6 }[mode];
    const base = opts.colors.slice(0, count);
    while (base.length < count) base.push(opts.colors[base.length % opts.colors.length] || '#ffffff');
    onUpdateOpts({ colorMode: mode, colors: base });
  };

  const applyPreset = (preset: string[]) => {
    const mode: ColorMode =
      preset.length === 1 ? 'mono' :
      preset.length === 2 ? 'dual' :
      preset.length === 3 ? 'tri' : 'multi';
    onUpdateOpts({ colors: preset, colorMode: mode });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Pattern selector */}
      <Section title="Pattern">
        <div className="grid grid-cols-3 gap-1.5">
          {PATTERN_LIST.map(p => (
            <button
              key={p.type}
              onClick={() => onSelectPattern(p.type)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all"
              style={{
                background: opts.type === p.type ? 'var(--accent)' : 'var(--bg-input)',
                color: opts.type === p.type ? 'var(--accent-fg)' : 'var(--text)',
                border: `1px solid ${opts.type === p.type ? 'transparent' : 'var(--border)'}`,
              }}
            >
              <span className="text-lg leading-none">{p.icon}</span>
              <span className="font-medium text-[10px] tracking-wide">{p.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
          {PATTERN_LIST.find(p => p.type === opts.type)?.desc}
        </p>
      </Section>

      {/* Size & spacing */}
      <Section title="Size & Spacing">
        <SliderRow
          label="Cell size"
          value={opts.cellSize}
          min={4} max={60}
          onChange={v => onUpdateOpts({ cellSize: v })}
          unit="px"
        />
        <SliderRow
          label="Gap"
          value={opts.gap}
          min={0} max={12}
          onChange={v => onUpdateOpts({ gap: v })}
          unit="px"
        />
        {(opts.type === 'pixelMosaic' || opts.type === 'checkerboard' || opts.type === 'waveChecker') && (
          <SliderRow
            label="Roundness"
            value={Math.round(opts.roundness * 100)}
            min={0} max={100}
            onChange={v => onUpdateOpts({ roundness: v / 100 })}
            unit="%"
          />
        )}
        {opts.type === 'waveChecker' && (
          <SliderRow
            label="Wave"
            value={Math.round(opts.waveIntensity * 100)}
            min={0} max={100}
            onChange={v => onUpdateOpts({ waveIntensity: v / 100 })}
            unit="%"
          />
        )}
        {(opts.type === 'pixelMosaic' || opts.type === 'circleArray' || opts.type === 'dotField') && (
          <label className="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input
              type="checkbox"
              checked={opts.hexGrid}
              onChange={e => onUpdateOpts({ hexGrid: e.target.checked })}
              className="w-3 h-3"
            />
            <span style={{ color: 'var(--text-muted)' }}>Hex grid offset</span>
          </label>
        )}
        {(opts.type === 'pixelMosaic' || opts.type === 'dotField') && (
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={opts.randomize}
              onChange={e => onUpdateOpts({ randomize: e.target.checked })}
              className="w-3 h-3"
            />
            <span style={{ color: 'var(--text-muted)' }}>Randomize colors</span>
          </label>
        )}
      </Section>

      {/* Colors */}
      <Section title="Colors">
        {/* Color mode tabs */}
        <div className="flex gap-1 mb-3">
          {(['mono','dual','tri','multi'] as ColorMode[]).map(m => (
            <button
              key={m}
              onClick={() => setColorMode(m)}
              className="flex-1 text-[10px] py-1 rounded font-medium tracking-wide transition-all"
              style={{
                background: opts.colorMode === m ? 'var(--accent)' : 'var(--bg-input)',
                color: opts.colorMode === m ? 'var(--accent-fg)' : 'var(--text-muted)',
                border: `1px solid ${opts.colorMode === m ? 'transparent' : 'var(--border)'}`,
              }}
            >
              {m === 'mono' ? '1' : m === 'dual' ? '2' : m === 'tri' ? '3' : '6+'}
            </button>
          ))}
        </div>

        {/* Color swatches */}
        <div className="flex gap-2 flex-wrap mb-3">
          {opts.colors.map((c, i) => (
            <label
              key={i}
              className="relative w-7 h-7 rounded-md overflow-hidden cursor-pointer shadow-sm"
              style={{ border: '2px solid var(--border)' }}
              title={`Color ${i + 1}`}
            >
              <input
                type="color"
                value={c}
                onChange={e => updateColor(i, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full rounded" style={{ background: c }} />
            </label>
          ))}
        </div>

        {/* Background color */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Background</span>
          <label
            className="relative w-7 h-7 rounded-md overflow-hidden cursor-pointer shadow-sm"
            style={{ border: '2px solid var(--border)' }}
          >
            <input
              type="color"
              value={opts.bg}
              onChange={e => onUpdateOpts({ bg: e.target.value })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full rounded" style={{ background: opts.bg }} />
          </label>
        </div>

        {/* Color presets */}
        <div className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>Presets</div>
        <div className="flex gap-2 flex-wrap">
          {presets.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className="flex gap-0.5 p-1 rounded"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-input)' }}
              title={preset.join(', ')}
            >
              {preset.slice(0, 4).map((c, j) => (
                <div key={j} className="w-3 h-3 rounded-sm" style={{ background: c }} />
              ))}
            </button>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <SliderRow
          label="Font size"
          value={text.fontSize}
          min={60} max={320}
          step={4}
          onChange={v => onUpdateText({ fontSize: v })}
          unit="px"
        />
        <SliderRow
          label="Spacing"
          value={text.letterSpacing}
          min={-20} max={40}
          onChange={v => onUpdateText({ letterSpacing: v })}
          unit="px"
        />
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>Font</span>
          <select
            value={text.fontFamily}
            onChange={e => onUpdateText({ fontFamily: e.target.value })}
            className="flex-1 text-xs rounded px-2 py-1.5 outline-none"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {FONT_LIST.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>Weight</span>
          <select
            value={text.fontWeight}
            onChange={e => onUpdateText({ fontWeight: e.target.value })}
            className="flex-1 text-xs rounded px-2 py-1.5 outline-none"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {['400','500','600','700','800','900'].map(w => (
              <option key={w} value={w}>{w === '400' ? 'Regular' : w === '500' ? 'Medium' : w === '600' ? 'SemiBold' : w === '700' ? 'Bold' : w === '800' ? 'ExtraBold' : 'Black'}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export */}
      <div className="p-4 shrink-0">
        <button
          onClick={onExport}
          className="w-full py-2.5 rounded-lg text-sm font-semibold tracking-widest uppercase transition-all hover:opacity-80 active:scale-[0.98]"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
          }}
        >
          Export SVG
        </button>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Exports at 2× resolution
        </p>
      </div>
    </div>
  );
}

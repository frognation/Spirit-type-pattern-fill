'use client';

import { useRef, useState } from 'react';
import { PatternOptions, TextConfig, ColorMode, PatternType } from '@/lib/types';

const SYSTEM_FONTS = [
  { label: 'Monospace', value: 'ui-monospace, monospace' },
  { label: 'Impact',    value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Georgia',   value: 'Georgia, serif' },
  { label: 'Courier',   value: '"Courier New", monospace' },
  { label: 'Arial Black', value: '"Arial Black", sans-serif' },
  { label: 'System UI', value: 'system-ui, sans-serif' },
];

type Preset = { colors: string[]; bg: string };

const COLOR_PRESETS: Record<PatternType, Preset[]> = {
  pixelMosaic: [
    { colors: ['#FF2D78','#00CC66','#FFCC00','#FF6B00','#0066FF','#CC0044'], bg: '#0a0a0a' },
    { colors: ['#FF0080','#00FFCC','#FFFF00','#FF8800'], bg: '#0a0a0a' },
    { colors: ['#FFFFFF','#AAAAAA','#555555','#222222'], bg: '#0a0a0a' },
    { colors: ['#FF6B6B','#FFE66D','#A8E063','#56CCF2'], bg: '#111111' },
  ],
  circleArray: [
    { colors: ['#4488FF','#ffffff'], bg: '#0a0a0a' },
    { colors: ['#FF2D78','#FFE8F0'], bg: '#0a0a0a' },
    { colors: ['#00CC66','#003311'], bg: '#0a0a0a' },
    { colors: ['#FFCC00','#2a1f00'], bg: '#111111' },
  ],
  checkerboard: [
    { colors: ['#2ECC71','#111111'], bg: '#ffffff' },
    { colors: ['#FF2D78','#f5f5f0'], bg: '#f5f5f0' },
    { colors: ['#4488FF','#0a0a0a'], bg: '#f5f5f0' },
    { colors: ['#FFCC00','#111111'], bg: '#f5f5f0' },
  ],
  stripeFill: [
    { colors: ['#FF2D9E','#1a3320'], bg: '#f0ede6' },
    { colors: ['#4488FF','#0a0a0a'], bg: '#f0ede6' },
    { colors: ['#FFCC00','#1a1000'], bg: '#f0ede6' },
    { colors: ['#FF2D78','#2D0020'], bg: '#f0ede6' },
  ],
  contourChecker: [
    { colors: ['#4488EE','#ffffff'], bg: '#CC2200' },
    { colors: ['#FF2D78','#ffffff'], bg: '#001133' },
    { colors: ['#00CC66','#ffffff'], bg: '#001a0d' },
    { colors: ['#FFCC00','#111111'], bg: '#1a1000' },
  ],
  outlineCircles: [
    { colors: ['#4488FF'], bg: '#0a0a0a' },
    { colors: ['#FF2D78'], bg: '#0a0a0a' },
    { colors: ['#00CC66'], bg: '#0a0a0a' },
    { colors: ['#FFCC00'], bg: '#111111' },
  ],
  blockMosaic: [
    { colors: ['#C8A882','#8B6347','#3A7D44','#E8C84A','#D45B3A','#7AAAC8','#C878A0','#888888'], bg: '#ffffff' },
    { colors: ['#FF2D78','#00CC66','#FFCC00','#FF6B00','#0066FF'], bg: '#ffffff' },
    { colors: ['#FFCDD2','#F8BBD9','#E1BEE7','#BBDEFB','#C8E6C9'], bg: '#f5f5f5' },
    { colors: ['#333333','#555555','#888888','#bbbbbb','#ffffff'], bg: '#f0f0f0' },
  ],
  ledMatrix: [
    { colors: ['#FF2D78','#00FF66','#FFCC00','#FF6B00','#0088FF','#FF00FF'], bg: '#000000' },
    { colors: ['#FF0000','#FF8800','#FFFF00','#00FF00','#00FFFF'], bg: '#000000' },
    { colors: ['#FF2D78','#CC0044'], bg: '#000000' },
    { colors: ['#00FF88','#008844'], bg: '#000000' },
  ],
  vertBars: [
    { colors: ['#FF2200','#00FF44','#FFCC00','#FF8800','#00CCFF','#222222'], bg: '#000000' },
    { colors: ['#FF2D78','#FF8800','#FFCC00'], bg: '#000000' },
    { colors: ['#00FF88','#0088FF','#8800FF'], bg: '#000000' },
    { colors: ['#FF2200','#004400'], bg: '#000000' },
  ],
};

// ── Sub-components ──────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
      {children}
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] w-[72px] shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1" />
      <span className="text-[11px] w-7 text-right tabular-nums shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{value}{unit}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer mb-2" onClick={() => onChange(!checked)}>
      <div className="relative w-7 h-4 rounded-full transition-all duration-150 shrink-0"
        style={{ background: checked ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.12)', border: `1px solid ${checked ? 'rgba(96,165,250,0.8)' : 'rgba(255,255,255,0.15)'}` }}>
        <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-150"
          style={{ background: '#fff', left: checked ? '14px' : '2px' }} />
      </div>
      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </label>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string; value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] w-[72px] shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 text-[10px] rounded-lg px-2 py-1.5 outline-none transition-colors duration-150"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

interface Props {
  opts: PatternOptions;
  text: TextConfig;
  onUpdateOpts: (p: Partial<PatternOptions>) => void;
  onUpdateText: (p: Partial<TextConfig>) => void;
  onExport: () => void;
}

export default function Sidebar({ opts, text, onUpdateOpts, onUpdateText, onExport }: Props) {
  const presets = COLOR_PRESETS[opts.type] ?? COLOR_PRESETS.pixelMosaic;

  const updateColor = (i: number, val: string) => {
    const colors = [...opts.colors]; colors[i] = val; onUpdateOpts({ colors });
  };
  const setColorMode = (mode: ColorMode) => {
    const count = { mono: 1, dual: 2, tri: 3, multi: 6 }[mode];
    const base = [...opts.colors];
    while (base.length < count) base.push(base[base.length % base.length] || '#fff');
    onUpdateOpts({ colorMode: mode, colors: base.slice(0, count) });
  };

  // ── Custom font upload ──────────────────────────────────────────────────────
  const [customFonts, setCustomFonts] = useState<{ label: string; value: string }[]>([]);
  const [fontLoading, setFontLoading] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const handleFontFile = async (file: File) => {
    setFontLoading(true);
    try {
      const buf = await file.arrayBuffer();
      // Derive a clean font name from the filename
      const rawName = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, '');
      const fontName = `__custom__${rawName}`;
      const face = new FontFace(fontName, buf);
      await face.load();
      document.fonts.add(face);
      const entry = { label: `↑ ${rawName}`, value: `"${fontName}", sans-serif` };
      setCustomFonts(prev => {
        // Replace if same name already loaded
        const filtered = prev.filter(f => f.label !== entry.label);
        return [...filtered, entry];
      });
      onUpdateText({ fontFamily: entry.value });
    } catch {
      alert('Font load failed. Please try a TTF, OTF, WOFF or WOFF2 file.');
    } finally {
      setFontLoading(false);
    }
  };

  const FONT_LIST = [
    ...SYSTEM_FONTS,
    ...customFonts,
  ];

  const showRoundness = ['pixelMosaic','checkerboard','contourChecker','ledMatrix'].includes(opts.type);
  const showHexGrid   = ['pixelMosaic','circleArray','outlineCircles'].includes(opts.type);
  const showRandomize = ['pixelMosaic','blockMosaic','ledMatrix','vertBars'].includes(opts.type);
  const showStroke    = ['contourChecker','outlineCircles'].includes(opts.type);

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header + Text */}
      <div className="px-4 pt-5 pb-4">
        <div className="text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>Spirit</div>
        <Label>Text</Label>
        <input
          value={text.text}
          onChange={e => onUpdateText({ text: e.target.value.toUpperCase() })}
          maxLength={14} placeholder="TYPE HERE"
          className="w-full text-[13px] font-mono uppercase tracking-[0.22em] outline-none px-3 py-2 rounded-lg transition-colors duration-150"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      <Divider />

      {/* Size & Spacing */}
      <div className="px-4 py-4">
        <Label>Size &amp; Spacing</Label>
        <SliderRow label="Cell size" value={opts.cellSize} min={4} max={80} onChange={v => onUpdateOpts({ cellSize: v })} unit="px" />
        <SliderRow label="Gap" value={opts.gap} min={0} max={12} onChange={v => onUpdateOpts({ gap: v })} unit="px" />
        {showRoundness && (
          <SliderRow label="Roundness" value={Math.round(opts.roundness * 100)} min={0} max={100} onChange={v => onUpdateOpts({ roundness: v / 100 })} unit="%" />
        )}
        {showStroke && (
          <SliderRow
            label={opts.type === 'outlineCircles' ? 'Stroke' : 'Smooth'}
            value={Math.round(opts.strokeDepth * 100)} min={0} max={100}
            onChange={v => onUpdateOpts({ strokeDepth: v / 100 })} unit="%"
          />
        )}
        {showHexGrid   && <Toggle label="Hex grid offset" checked={opts.hexGrid}   onChange={v => onUpdateOpts({ hexGrid: v })} />}
        {showRandomize && <Toggle label="Randomize colors" checked={opts.randomize} onChange={v => onUpdateOpts({ randomize: v })} />}
      </div>

      <Divider />

      {/* Colors */}
      <div className="px-4 py-4">
        <Label>Colors</Label>

        {/* Color mode */}
        <div className="flex gap-1.5 mb-3">
          {(['mono','dual','tri','multi'] as ColorMode[]).map(m => {
            const active = opts.colorMode === m;
            return (
              <button key={m} onClick={() => setColorMode(m)}
                className="flex-1 text-[10px] uppercase tracking-wider py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                style={active
                  ? { border: '1px solid rgba(96,165,250,0.55)', background: 'rgba(96,165,250,0.14)', color: 'rgba(147,197,253,0.9)' }
                  : { border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { if (!active) { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.25)'; el.style.color = 'rgba(255,255,255,0.7)'; } }}
                onMouseLeave={e => { if (!active) { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'rgba(255,255,255,0.4)'; } }}
              >
                {m === 'mono' ? '1' : m === 'dual' ? '2' : m === 'tri' ? '3' : '6+'}
              </button>
            );
          })}
        </div>

        {/* Color swatches */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {opts.colors.map((c, i) => (
            <label key={i} className="relative cursor-pointer"
              style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid rgba(255,255,255,0.18)', overflow: 'hidden', background: c }}>
              <input type="color" value={c} onChange={e => updateColor(i, e.target.value)}
                style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
          ))}
        </div>

        {/* Background */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] w-[72px] shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>Background</span>
          <label className="relative cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid rgba(255,255,255,0.18)', overflow: 'hidden', background: opts.bg }}>
            <input type="color" value={opts.bg} onChange={e => onUpdateOpts({ bg: e.target.value })}
              style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
          </label>
        </div>

        {/* Presets */}
        <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Presets</div>
        <div className="flex gap-2 flex-wrap">
          {presets.map((preset, i) => (
            <button key={i} onClick={() => onUpdateOpts({ colors: preset.colors, bg: preset.bg })}
              className="flex gap-0.5 p-1 rounded-md cursor-pointer transition-all duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
              {preset.colors.slice(0, 5).map((c, j) => (
                <div key={j} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Typography */}
      <div className="px-4 py-4">
        <Label>Typography</Label>
        <SliderRow label="Font size" value={text.fontSize} min={60} max={320} step={4} onChange={v => onUpdateText({ fontSize: v })} unit="px" />
        <SliderRow label="Spacing" value={text.letterSpacing} min={-20} max={60} onChange={v => onUpdateText({ letterSpacing: v })} unit="px" />
        <SelectRow label="Font" value={text.fontFamily} options={FONT_LIST} onChange={v => onUpdateText({ fontFamily: v })} />
        <SelectRow label="Weight" value={text.fontWeight}
          options={[
            { label: 'Regular', value: '400' }, { label: 'Medium', value: '500' },
            { label: 'SemiBold', value: '600' }, { label: 'Bold', value: '700' },
            { label: 'ExtraBold', value: '800' }, { label: 'Black', value: '900' },
          ]}
          onChange={v => onUpdateText({ fontWeight: v })} />

        {/* Local font upload */}
        <input
          ref={fontInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFontFile(f); e.target.value = ''; }}
        />
        <button
          onClick={() => fontInputRef.current?.click()}
          disabled={fontLoading}
          className="w-full py-1.5 mt-1 rounded-lg text-[10px] uppercase tracking-[0.14em] transition-all duration-150 cursor-pointer"
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: fontLoading ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)',
          }}
          onMouseEnter={e => { if (!fontLoading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = fontLoading ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)'; }}
        >
          {fontLoading ? 'Loading…' : '↑ Upload Font  (TTF · OTF · WOFF)'}
        </button>
        {customFonts.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {customFonts.map(f => (
              <div key={f.value} className="flex items-center justify-between">
                <span className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 160 }}>
                  {f.label}
                </span>
                <button
                  onClick={() => {
                    setCustomFonts(prev => prev.filter(x => x.value !== f.value));
                    if (text.fontFamily === f.value) onUpdateText({ fontFamily: SYSTEM_FONTS[0].value });
                  }}
                  className="text-[9px] cursor-pointer"
                  style={{ color: 'rgba(239,68,68,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />
      <Divider />

      {/* Export */}
      <div className="px-4 py-4">
        <button onClick={onExport}
          className="w-full py-2 rounded-lg text-[10px] uppercase tracking-[0.18em] transition-all duration-150 cursor-pointer"
          style={{ border: '1px solid rgba(96,165,250,0.5)', background: 'rgba(96,165,250,0.14)', color: 'rgba(147,197,253,0.9)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.8)'; e.currentTarget.style.background = 'rgba(96,165,250,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'; e.currentTarget.style.background = 'rgba(96,165,250,0.14)'; }}>
          Export SVG
        </button>
        <div className="text-[9px] text-center mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>2× resolution vector</div>
      </div>
    </div>
  );
}

import { PatternElement } from './types';

export function exportSVG(
  elements: PatternElement[],
  width: number,
  height: number,
  bg: string
): string {
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <rect width="${width}" height="${height}" fill="${bg}"/>`,
  ];

  // Group by color for more compact output
  const byColor = new Map<string, PatternElement[]>();
  for (const el of elements) {
    const c = el.color;
    if (!byColor.has(c)) byColor.set(c, []);
    byColor.get(c)!.push(el);
  }

  for (const [color, els] of byColor) {
    lines.push(`  <g fill="${color}">`);
    for (const el of els) {
      if (el.kind === 'rect') {
        const rxAttr = el.rx > 0 ? ` rx="${Math.min(el.rx, el.w / 2, el.h / 2).toFixed(1)}"` : '';
        lines.push(
          `    <rect x="${el.x.toFixed(1)}" y="${el.y.toFixed(1)}" width="${el.w.toFixed(1)}" height="${el.h.toFixed(1)}"${rxAttr}/>`
        );
      } else {
        lines.push(
          `    <circle cx="${el.cx.toFixed(1)}" cy="${el.cy.toFixed(1)}" r="${el.r.toFixed(1)}"/>`
        );
      }
    }
    lines.push(`  </g>`);
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

export function downloadSVG(svgString: string, filename = 'spirit-pattern.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

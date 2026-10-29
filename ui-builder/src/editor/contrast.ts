import type { Elements } from './tree';

export function parseHex(color?: string): [number, number, number] | null {
  const m = color?.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg?: string, bg?: string) {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Procura o primeiro fundo sólido subindo pela árvore a partir de `startId`. */
export function effectiveBackground(elements: Elements, startId: string | null) {
  let el = startId ? elements[startId] : undefined;
  while (el) {
    if (parseHex(el.background)) return el.background;
    el = el.parentId ? elements[el.parentId] : undefined;
  }
  return '#FFFFFF';
}

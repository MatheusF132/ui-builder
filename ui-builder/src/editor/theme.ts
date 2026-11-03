import type { Project, Theme, ThemeColor } from './types';

export const THEME_COLORS: ThemeColor[] = [
  'primary', 'onPrimary', 'soft', 'onSoft', 'ink', 'muted',
  'line', 'surface', 'alt', 'danger', 'success',
];

export const FONT_STACKS: Record<Theme['font'], string> = {
  manrope: "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
};

/** Multiplicador aplicado ao radius dos elementos escalaveis. */
export const ROUNDNESS: Record<Theme['roundness'], number> = {
  none: 0,
  soft: 1,
  round: 2,
};

export const DEFAULT_COLORS: Record<ThemeColor, string> = {
  primary: '#3B4BC8',
  onPrimary: '#FFFFFF',
  soft: '#E4E8FB',
  onSoft: '#2A3590',
  ink: '#1B2230',
  muted: '#5B6578',
  line: '#CBD2DE',
  surface: '#FFFFFF',
  alt: '#F3F5F9',
  danger: '#D13B3B',
  success: '#1E8A55',
};

export const DEFAULT_THEME: Theme = {
  colors: DEFAULT_COLORS,
  font: 'manrope',
  roundness: 'soft',
};

/** Projetos antigos (v0.1) nao tem tema: cai no padrao. */
export function getTheme(project: Pick<Project, 'theme'>): Theme {
  const t = project.theme;
  if (!t) return DEFAULT_THEME;
  return {
    font: t.font ?? DEFAULT_THEME.font,
    roundness: t.roundness ?? DEFAULT_THEME.roundness,
    colors: { ...DEFAULT_COLORS, ...t.colors },
  };
}

export function isToken(v: unknown): v is ThemeColor {
  return typeof v === 'string' && (THEME_COLORS as string[]).includes(v);
}

/** Converte um token ("primary") em hex; valores que nao sao token passam direto. */
export function resolveColor(v: string, theme: Theme): string;
export function resolveColor(v: string | undefined, theme: Theme): string | undefined;
export function resolveColor(v: string | undefined, theme: Theme): string | undefined {
  if (v === undefined) return undefined;
  return isToken(v) ? theme.colors[v] : v;
}

/* ---------- Derivar uma paleta a partir da cor primaria ---------- */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: RGB): string {
  const part = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

/**
 * Gera as cores do tema a partir de uma cor primaria, garantindo contraste
 * do texto sobre a primaria (onPrimary) e sobre o fundo suave (onSoft).
 * Os neutros e as cores de feedback (danger/success) ficam com o padrao.
 * Se o hex for invalido, devolve a paleta padrao.
 */
export function deriveFromPrimary(primaryHex: string): Record<ThemeColor, string> {
  const p = hexToRgb(primaryHex);
  if (!p) return { ...DEFAULT_COLORS };

  const onPrimary = ratio(p, WHITE) >= ratio(p, BLACK) ? WHITE : BLACK;

  const soft = mix(p, WHITE, 0.88);
  let onSoft = p;
  for (let t = 0; t <= 1 && ratio(onSoft, soft) < 4.5; t += 0.05) {
    onSoft = mix(p, BLACK, t);
  }

  return {
    ...DEFAULT_COLORS,
    primary: rgbToHex(p),
    onPrimary: rgbToHex(onPrimary),
    soft: rgbToHex(soft),
    onSoft: rgbToHex(onSoft),
  };
}

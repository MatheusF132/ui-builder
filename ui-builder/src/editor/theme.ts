import { contrastRatio, parseHex } from './contrast';
import type { Project, Theme, ThemeColor } from './types';

export const TOKEN_LABELS: Record<ThemeColor, string> = {
  primary: 'Principal', onPrimary: 'Texto sobre a principal', soft: 'Principal suave', onSoft: 'Texto sobre a suave',
  ink: 'Texto', muted: 'Texto secundário', line: 'Linhas e bordas', surface: 'Superfície',
  alt: 'Superfície alternativa', danger: 'Perigo', success: 'Sucesso',
};

export const FONT_STACKS: Record<Theme['font'], string> = {
  manrope: "'Manrope Variable', system-ui, sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'Cascadia Code', Consolas, monospace",
};
export const FONT_LABELS: Record<Theme['font'], string> = {
  manrope: 'Manrope', system: 'Sans do sistema', serif: 'Serifada', mono: 'Monoespaçada',
};
export const ROUNDNESS: Record<Theme['roundness'], number> = { none: 0, soft: 1, round: 1.8 };
export const ROUNDNESS_LABELS: Record<Theme['roundness'], string> = { none: 'Reto', soft: 'Suave', round: 'Arredondado' };

const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a: string, b: string, t: number) {
  const x = parseHex(a) ?? [0, 0, 0];
  const y = parseHex(b) ?? [0, 0, 0];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

/** A partir de uma única cor, gera as cores que dependem dela e garante contraste legível. */
export function deriveFromPrimary(primary: string): Pick<Theme['colors'], 'primary' | 'onPrimary' | 'soft' | 'onSoft'> {
  const onPrimary = (contrastRatio('#FFFFFF', primary) ?? 0) >= 4.5 ? '#FFFFFF' : '#1B2230';
  const soft = mix(primary, '#FFFFFF', 0.88);
  let onSoft = primary;
  for (let i = 1; i <= 10 && (contrastRatio(onSoft, soft) ?? 0) < 4.5; i++) onSoft = mix(primary, '#000000', i * 0.1);
  return { primary: primary.toUpperCase(), onPrimary, soft, onSoft };
}

const BASE_NEUTRALS = {
  ink: '#1B2230', muted: '#5A6475', line: '#D9DDE6', surface: '#FFFFFF', alt: '#F1F3F8',
  danger: '#C62F2F', success: '#12794B',
};

function makeTheme(primary: string, neutrals: Partial<typeof BASE_NEUTRALS> = {}): Theme['colors'] {
  return { ...BASE_NEUTRALS, ...neutrals, ...deriveFromPrimary(primary) };
}

export const DEFAULT_THEME: Theme = { colors: makeTheme('#3A4BFF'), font: 'manrope', roundness: 'soft' };

export const PRESET_THEMES: { name: string; colors: Theme['colors'] }[] = [
  { name: 'Ultramarino', colors: makeTheme('#3A4BFF') },
  { name: 'Floresta', colors: makeTheme('#0F7B5F', { ink: '#12261F', muted: '#4F6A60', line: '#CBD9D3', alt: '#EEF4F1' }) },
  { name: 'Pôr do sol', colors: makeTheme('#C2410C', { ink: '#2A1A14', muted: '#6B5248', line: '#E6D3C7', alt: '#FBF1EA' }) },
  { name: 'Magenta', colors: makeTheme('#B4237A', { ink: '#2A1424', muted: '#6B4D60', line: '#E6D0DC', alt: '#FAEFF5' }) },
  { name: 'Grafite', colors: makeTheme('#1B2230', { alt: '#F1F2F5', line: '#D2D6DE' }) },
];

export const getTheme = (project: Project): Theme => project.theme ?? DEFAULT_THEME;

/** Valores que começam com "$" apontam para uma cor do tema (ex.: "$primary"). */
export const isToken = (value?: string): value is `$${ThemeColor}` => !!value && value.startsWith('$');

export function resolveColor(value: string | undefined, theme: Theme): string | undefined {
  if (!isToken(value)) return value;
  return theme.colors[value.slice(1) as ThemeColor] ?? undefined;
}

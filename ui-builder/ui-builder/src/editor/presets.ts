import type { Target } from './types';

export interface Preset { label: string; width: number; height: number }

export const PRESETS: Record<Target, Preset[]> = {
  web: [
    { label: 'Desktop', width: 1440, height: 900 },
    { label: 'Notebook', width: 1280, height: 800 },
    { label: 'Tablet', width: 768, height: 1024 },
  ],
  mobile: [
    { label: 'iPhone 15', width: 393, height: 852 },
    { label: 'Android compacto', width: 360, height: 800 },
    { label: 'iPhone SE', width: 375, height: 667 },
  ],
};

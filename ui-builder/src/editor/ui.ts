import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEditor } from './store';
import { DEFAULT_THEME, accentFor, getTheme } from './theme';

export type UiMode = 'light' | 'dark' | 'auto';

interface UiState {
  mode: UiMode;
  /** A cor de destaque do editor acompanha a cor principal do tema do projeto. */
  followProject: boolean;
  /** Mostra as setas de fluxo entre as telas no canvas. */
  showFlow: boolean;
  setShowFlow: (show: boolean) => void;
  setMode: (mode: UiMode) => void;
  setFollowProject: (follow: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      mode: 'auto',
      followProject: true,
      showFlow: true,
      setShowFlow: (showFlow) => set({ showFlow }),
      setMode: (mode) => set({ mode }),
      setFollowProject: (followProject) => set({ followProject }),
    }),
    { name: 'ui-builder:ui' },
  ),
);

/** Aplica o tema da interface do editor (claro/escuro e cor de destaque) na página. */
export function useAppearance() {
  const mode = useUi((s) => s.mode);
  const follow = useUi((s) => s.followProject);
  const primary = useEditor((s) => (s.project ? getTheme(s.project).colors.primary : DEFAULT_THEME.colors.primary));

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'auto' && mq.matches);
      const root = document.documentElement;
      const { accent, ink, soft } = accentFor(follow ? primary : DEFAULT_THEME.colors.primary, dark);
      root.dataset.ui = dark ? 'dark' : 'light';
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--accent-ink', ink);
      root.style.setProperty('--accent-soft', soft);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [mode, follow, primary]);
}

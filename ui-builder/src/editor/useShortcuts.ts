import { useEffect } from 'react';
import { useEditor } from './store';

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const s = useEditor.getState();
      if (!s.project) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const sel = s.selectedId ? s.project.elements[s.selectedId] : null;

      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return; }
      if (mod && key === 'y') { e.preventDefault(); s.redo(); return; }
      if (mod && key === 'd' && sel) { e.preventDefault(); s.duplicate(sel.id); return; }
      if (e.key === 'Escape') { s.select(null); return; }
      if (!sel || sel.id === s.project.rootId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); s.remove(sel.id); return; }

      const step = e.shiftKey ? 10 : 1;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const m = moves[e.key];
      if (m && !sel.locked) { e.preventDefault(); s.update(sel.id, { x: sel.x + m[0], y: sel.y + m[1] }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

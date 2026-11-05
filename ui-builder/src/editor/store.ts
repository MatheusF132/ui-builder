import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorElement, Project, Target, Theme } from './types';
import { DEFAULT_THEME, getTheme } from './theme';
import { applyConstraints, cloneSubtree, collectIds, flatten, type Elements, type NodeSpec } from './tree';
import { getScreens, screenOf } from './screens';

const HISTORY_LIMIT = 100;
const SCREEN_GAP = 80;

/** Cada passo do histórico guarda os elementos, o tema e a lista de telas. */
interface Snapshot { elements: Elements; theme: Theme; screens: string[] }

const snapshot = (p: Project): Snapshot => ({ elements: p.elements, theme: getTheme(p), screens: getScreens(p) });
const restore = (p: Project, s: Snapshot): Project => ({ ...p, elements: s.elements, theme: s.theme, screens: s.screens, rootId: s.screens[0] });

interface EditorState {
  project: Project | null;
  selectedId: string | null;
  activeScreen: string | null;
  zoom: number;
  fitTick: number;
  past: Snapshot[];
  future: Snapshot[];
  lastKey: string;
  lastTime: number;
  createProject: (name: string, target: Target, width: number, height: number) => void;
  loadProject: (project: Project) => void;
  closeProject: () => void;
  setProjectName: (name: string) => void;
  select: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  requestFit: () => void;
  pushHistory: () => void;
  setTheme: (patch: Partial<Theme>) => void;
  update: (id: string, patch: Partial<EditorElement>, record?: boolean) => void;
  addSpec: (spec: NodeSpec, parentId?: string, at?: { x: number; y: number }) => void;
  addScreen: () => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  reorder: (id: string, dir: 1 | -1) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditor = create<EditorState>()(
  persist(
    (set, get) => ({
      project: null,
      selectedId: null,
      activeScreen: null,
      zoom: 1,
      fitTick: 0,
      past: [],
      future: [],
      lastKey: '',
      lastTime: 0,

      createProject: (name, target, width, height) => {
        const { id, elements } = flatten(
          {
            type: 'frame',
            name: `${target === 'web' ? 'Página' : 'Tela'} 1`,
            width,
            height,
            background: '$surface',
            radius: target === 'mobile' ? 36 : 0,
            shadow: 'lg',
          },
          null,
        );
        set({
          project: { name, target, rootId: id, screens: [id], elements, theme: DEFAULT_THEME },
          selectedId: null, activeScreen: id, past: [], future: [],
        });
        get().requestFit();
      },

      loadProject: (project) => {
        set({ project, selectedId: null, activeScreen: getScreens(project)[0], past: [], future: [] });
        get().requestFit();
      },

      closeProject: () => set({ project: null, selectedId: null, activeScreen: null, past: [], future: [] }),

      setProjectName: (name) => {
        const p = get().project;
        if (p) set({ project: { ...p, name } });
      },

      select: (id) => {
        const p = get().project;
        set({ selectedId: id, ...(id && p ? { activeScreen: screenOf(p.elements, id) ?? null } : {}) });
      },
      setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.1, zoom)) }),
      requestFit: () => set((s) => ({ fitTick: s.fitTick + 1 })),

      pushHistory: () => {
        const p = get().project;
        if (!p) return;
        set((s) => ({ past: [...s.past.slice(-(HISTORY_LIMIT - 1)), snapshot(p)], future: [], lastKey: '' }));
      },

      setTheme: (patch) => {
        const p = get().project;
        if (!p) return;
        // Ajustes seguidos (ex.: arrastar o seletor de cor) viram um único passo do "desfazer".
        const key = 'theme:' + Object.keys(patch).join();
        const now = Date.now();
        if (get().lastKey !== key || now - get().lastTime > 800) get().pushHistory();
        set({ lastKey: key, lastTime: now });
        set({ project: { ...p, theme: { ...getTheme(p), ...patch } } });
      },

      update: (id, patch, record = true) => {
        const p = get().project;
        if (!p || !p.elements[id]) return;
        if (record) {
          // Edições seguidas no mesmo campo viram um único passo do "desfazer".
          const key = id + Object.keys(patch).join();
          const now = Date.now();
          if (key !== get().lastKey || now - get().lastTime > 800) get().pushHistory();
          set({ lastKey: key, lastTime: now });
        }
        const old = p.elements[id];
        let elements = { ...p.elements, [id]: { ...old, ...patch } };
        const w = patch.width ?? old.width;
        const h = patch.height ?? old.height;
        // O frame mudou de tamanho: os filhos reagem conforme suas restrições.
        if ((w !== old.width || h !== old.height) && old.children.length) elements = applyConstraints(elements, id, old.width, old.height, w, h);
        set({ project: { ...p, elements } });
      },

      addSpec: (spec, parentId, at) => {
        const { project: p, selectedId, activeScreen } = get();
        if (!p) return;
        const sel = selectedId ? p.elements[selectedId] : null;
        const screens = getScreens(p);
        const active = activeScreen && p.elements[activeScreen] ? activeScreen : screens[0];
        const parent = parentId ?? (sel?.type === 'frame' ? sel.id : sel ? screenOf(p.elements, sel.id)! : active);
        const parentEl = p.elements[parent];
        get().pushHistory();
        const { id, elements: added } = flatten(spec, parent);
        const el = added[id];
        el.x = at ? Math.max(0, at.x) : Math.max(0, Math.round((parentEl.width - el.width) / 2));
        el.y = at ? Math.max(0, at.y) : 48 + ((parentEl.children.length * 16) % 160);
        set({
          project: {
            ...p,
            elements: {
              ...p.elements,
              ...added,
              [parent]: { ...parentEl, children: [...parentEl.children, id] },
            },
          },
          selectedId: id,
          activeScreen: screenOf(added, id) ?? screenOf(p.elements, parent) ?? active,
        });
      },

      addScreen: () => {
        const p = get().project;
        if (!p) return;
        const screens = getScreens(p);
        const first = p.elements[screens[0]];
        const last = p.elements[screens[screens.length - 1]];
        get().pushHistory();
        const { id, elements: added } = flatten(
          {
            type: 'frame',
            name: `${p.target === 'web' ? 'Página' : 'Tela'} ${screens.length + 1}`,
            width: first.width,
            height: first.height,
            background: '$surface',
            radius: first.radius,
            shadow: 'lg',
          },
          null,
        );
        added[id].x = last.x + last.width + SCREEN_GAP;
        added[id].y = last.y;
        set({
          project: { ...p, elements: { ...p.elements, ...added }, screens: [...screens, id] },
          selectedId: id, activeScreen: id,
        });
        get().requestFit();
      },

      remove: (id) => {
        const p = get().project;
        const el = p?.elements[id];
        if (!p || !el) return;
        const screens = getScreens(p);
        get().pushHistory();
        const next = { ...p.elements };
        if (el.parentId === null) {
          if (screens.length <= 1) return;
          collectIds(next, id).forEach((key) => delete next[key]);
          // Interações que levavam à tela excluída deixam de apontar para ela.
          for (const k of Object.keys(next)) if (next[k].link === id) next[k] = { ...next[k], link: undefined };
          const rest = screens.filter((s) => s !== id);
          set({ project: { ...p, elements: next, screens: rest, rootId: rest[0] }, selectedId: null, activeScreen: rest[0] });
          return;
        }
        const parentId = el.parentId;
        collectIds(next, id).forEach((key) => delete next[key]);
        next[parentId] = { ...next[parentId], children: next[parentId].children.filter((c) => c !== id) };
        set({ project: { ...p, elements: next }, selectedId: null });
      },

      duplicate: (id) => {
        const p = get().project;
        const el = p?.elements[id];
        if (!p || !el) return;
        get().pushHistory();
        if (el.parentId === null) {
          const screens = getScreens(p);
          const last = p.elements[screens[screens.length - 1]];
          const { id: newId, added } = cloneSubtree(p.elements, id, null, 0);
          added[newId] = { ...added[newId], x: last.x + last.width + SCREEN_GAP, y: last.y, name: `${el.name} (cópia)` };
          set({
            project: { ...p, elements: { ...p.elements, ...added }, screens: [...screens, newId] },
            selectedId: newId, activeScreen: newId,
          });
          get().requestFit();
          return;
        }
        const { id: newId, added } = cloneSubtree(p.elements, id, el.parentId, 16);
        const parent = p.elements[el.parentId];
        set({
          project: {
            ...p,
            elements: {
              ...p.elements,
              ...added,
              [parent.id]: { ...parent, children: [...parent.children, newId] },
            },
          },
          selectedId: newId,
        });
      },

      reorder: (id, dir) => {
        const p = get().project;
        const el = p?.elements[id];
        if (!p || !el?.parentId) return;
        const parent = p.elements[el.parentId];
        const from = parent.children.indexOf(id);
        const to = from + dir;
        if (to < 0 || to >= parent.children.length) return;
        get().pushHistory();
        const children = [...parent.children];
        [children[from], children[to]] = [children[to], children[from]];
        set({ project: { ...p, elements: { ...p.elements, [parent.id]: { ...parent, children } } } });
      },

      undo: () => {
        const { past, project, selectedId } = get();
        if (!project || !past.length) return;
        const prev = past[past.length - 1];
        set((s) => ({
          past: s.past.slice(0, -1),
          future: [snapshot(project), ...s.future],
          project: restore(project, prev),
          selectedId: selectedId && prev.elements[selectedId] ? selectedId : null,
          activeScreen: s.activeScreen && prev.elements[s.activeScreen] ? s.activeScreen : prev.screens[0],
          lastKey: '',
        }));
      },

      redo: () => {
        const { future, project, selectedId } = get();
        if (!project || !future.length) return;
        const next = future[0];
        set((s) => ({
          future: s.future.slice(1),
          past: [...s.past, snapshot(project)],
          project: restore(project, next),
          selectedId: selectedId && next.elements[selectedId] ? selectedId : null,
          activeScreen: s.activeScreen && next.elements[s.activeScreen] ? s.activeScreen : next.screens[0],
          lastKey: '',
        }));
      },
    }),
    { name: 'ui-builder:project', partialize: (s) => ({ project: s.project }) },
  ),
);

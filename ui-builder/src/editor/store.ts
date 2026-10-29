import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorElement, Project, Target } from './types';
import { cloneSubtree, collectIds, flatten, type Elements, type NodeSpec } from './tree';

const HISTORY_LIMIT = 100;

interface EditorState {
  project: Project | null;
  selectedId: string | null;
  zoom: number;
  fitTick: number;
  past: Elements[];
  future: Elements[];
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
  update: (id: string, patch: Partial<EditorElement>, record?: boolean) => void;
  addSpec: (spec: NodeSpec, parentId?: string, at?: { x: number; y: number }) => void;
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
            name: target === 'web' ? 'Página' : 'Tela',
            width,
            height,
            background: '#FFFFFF',
            radius: target === 'mobile' ? 36 : 0,
            shadow: 'lg',
          },
          null,
        );
        set({ project: { name, target, rootId: id, elements }, selectedId: null, past: [], future: [] });
        get().requestFit();
      },

      loadProject: (project) => {
        set({ project, selectedId: null, past: [], future: [] });
        get().requestFit();
      },

      closeProject: () => set({ project: null, selectedId: null, past: [], future: [] }),

      setProjectName: (name) => {
        const p = get().project;
        if (p) set({ project: { ...p, name } });
      },

      select: (id) => set({ selectedId: id }),
      setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.1, zoom)) }),
      requestFit: () => set((s) => ({ fitTick: s.fitTick + 1 })),

      pushHistory: () => {
        const p = get().project;
        if (!p) return;
        set((s) => ({ past: [...s.past.slice(-(HISTORY_LIMIT - 1)), p.elements], future: [], lastKey: '' }));
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
        set({ project: { ...p, elements: { ...p.elements, [id]: { ...p.elements[id], ...patch } } } });
      },

      addSpec: (spec, parentId, at) => {
        const { project: p, selectedId } = get();
        if (!p) return;
        const sel = selectedId ? p.elements[selectedId] : null;
        const parent = parentId ?? (sel?.type === 'frame' ? sel.id : p.rootId);
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
        });
      },

      remove: (id) => {
        const p = get().project;
        if (!p || id === p.rootId) return;
        get().pushHistory();
        const next = { ...p.elements };
        const parentId = next[id].parentId!;
        collectIds(next, id).forEach((key) => delete next[key]);
        next[parentId] = { ...next[parentId], children: next[parentId].children.filter((c) => c !== id) };
        set({ project: { ...p, elements: next }, selectedId: null });
      },

      duplicate: (id) => {
        const p = get().project;
        const el = p?.elements[id];
        if (!p || !el || !el.parentId) return;
        get().pushHistory();
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
          future: [project.elements, ...s.future],
          project: { ...project, elements: prev },
          selectedId: selectedId && prev[selectedId] ? selectedId : null,
          lastKey: '',
        }));
      },

      redo: () => {
        const { future, project, selectedId } = get();
        if (!project || !future.length) return;
        const next = future[0];
        set((s) => ({
          future: s.future.slice(1),
          past: [...s.past, project.elements],
          project: { ...project, elements: next },
          selectedId: selectedId && next[selectedId] ? selectedId : null,
          lastKey: '',
        }));
      },
    }),
    { name: 'ui-builder:project', partialize: (s) => ({ project: s.project }) },
  ),
);

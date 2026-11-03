import { useEffect, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useEditor } from '../editor/store';
import { absolutePos, type Elements } from '../editor/tree';
import { LIBRARY } from '../editor/library';
import { getScreens } from '../editor/screens';
import { getTheme } from '../editor/theme';
import { ElementView } from './ElementView';

const HANDLES = {
  nw: [0, 0, 'nwse-resize'], n: [50, 0, 'ns-resize'], ne: [100, 0, 'nesw-resize'], e: [100, 50, 'ew-resize'],
  se: [100, 100, 'nwse-resize'], s: [50, 100, 'ns-resize'], sw: [0, 100, 'nesw-resize'], w: [0, 50, 'ew-resize'],
} as const;

const MIN = 8;
const SNAP = 6; // distância (px da tela) em que o alinhamento "gruda"

interface Rect { x: number; y: number; w: number; h: number }
interface Guide { o: 'v' | 'h'; pos: number; from: number; to: number }
interface Drag {
  mode: 'move' | 'resize';
  id: string;
  handle?: string;
  sx: number; sy: number;
  ox: number; oy: number; ow: number; oh: number;
  origin: { x: number; y: number };
  cands: Rect[];
  root: boolean;
  moved: boolean;
}

const idFrom = (t: EventTarget | null) => (t as HTMLElement | null)?.closest<HTMLElement>('[data-id]')?.dataset.id ?? null;
const typing = (t: EventTarget | null) => ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes((t as HTMLElement).tagName);

const xs = (r: Rect) => [r.x, r.x + r.w / 2, r.x + r.w];
const ys = (r: Rect) => [r.y, r.y + r.h / 2, r.y + r.h];

/** Com o que o elemento pode se alinhar: o pai e os irmãos (para uma tela, as outras telas). */
function candidates(elements: Elements, id: string, screens: string[]): Rect[] {
  const el = elements[id];
  if (el.parentId === null) {
    return screens.filter((sid) => sid !== id).map((sid) => ({ x: elements[sid].x, y: elements[sid].y, w: elements[sid].width, h: elements[sid].height }));
  }
  const parent = elements[el.parentId];
  const list: Rect[] = [{ x: 0, y: 0, w: parent.width, h: parent.height }];
  for (const sid of parent.children) {
    const s = elements[sid];
    if (sid !== id && !s.hidden) list.push({ x: s.x, y: s.y, w: s.width, h: s.height });
  }
  return list;
}

/** Menor ajuste que alinha algum dos valores a alguma linha dos candidatos (0 se nada estiver perto). */
function nearest(values: number[], cands: Rect[], axis: 'x' | 'y', thr: number) {
  let best = 0;
  let bestAbs = Infinity;
  for (const v of values)
    for (const r of cands)
      for (const l of axis === 'x' ? xs(r) : ys(r)) {
        const d = l - v;
        if (Math.abs(d) <= thr && Math.abs(d) < bestAbs) { best = d; bestAbs = Math.abs(d); }
      }
  return best;
}

/** Linhas vermelhas para tudo que está alinhado no resultado final. */
function computeGuides(f: Rect, cands: Rect[], o: { x: number; y: number }): Guide[] {
  const out = new Map<string, Guide>();
  const add = (key: string, g: Guide) => {
    const prev = out.get(key);
    out.set(key, prev ? { ...g, from: Math.min(prev.from, g.from), to: Math.max(prev.to, g.to) } : g);
  };
  for (const r of cands) {
    for (const l of xs(r)) {
      if (xs(f).some((v) => Math.abs(v - l) < 0.5)) {
        add(`v${l}`, { o: 'v', pos: o.x + l, from: o.y + Math.min(f.y, r.y), to: o.y + Math.max(f.y + f.h, r.y + r.h) });
      }
    }
    for (const l of ys(r)) {
      if (ys(f).some((v) => Math.abs(v - l) < 0.5)) {
        add(`h${l}`, { o: 'h', pos: o.y + l, from: o.x + Math.min(f.x, r.x), to: o.x + Math.max(f.x + f.w, r.x + r.w) });
      }
    }
  }
  return [...out.values()];
}

export function Canvas() {
  const project = useEditor((s) => s.project)!;
  const selectedId = useEditor((s) => s.selectedId);
  const zoom = useEditor((s) => s.zoom);
  const fitTick = useEditor((s) => s.fitTick);
  const { select, addSpec } = useEditor.getState();
  const viewport = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const space = useRef(false);
  const pan = useRef<{ sx: number; sy: number; sl: number; st: number } | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [panMode, setPanMode] = useState(false);

  const screens = getScreens(project);
  const world = {
    w: Math.max(...screens.map((id) => project.elements[id].x + project.elements[id].width)),
    h: Math.max(...screens.map((id) => project.elements[id].y + project.elements[id].height)),
  };
  const sel = selectedId ? project.elements[selectedId] : null;
  const hover = hoverId && hoverId !== selectedId ? project.elements[hoverId] : null;
  const theme = getTheme(project);

  // Ajusta o zoom para o projeto caber na área visível.
  useEffect(() => {
    const v = viewport.current;
    const p = useEditor.getState().project;
    if (!v || !p) return;
    const ids = getScreens(p);
    const w = Math.max(...ids.map((id) => p.elements[id].x + p.elements[id].width));
    const h = Math.max(...ids.map((id) => p.elements[id].y + p.elements[id].height));
    const z = Math.min(1, (v.clientWidth - 160) / w, (v.clientHeight - 160) / h);
    useEditor.getState().setZoom(Math.round(z * 100) / 100);
  }, [fitTick]);

  // Ctrl + roda do mouse = zoom.
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      useEditor.getState().setZoom(useEditor.getState().zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    v.addEventListener('wheel', onWheel, { passive: false });
    return () => v.removeEventListener('wheel', onWheel);
  }, []);

  // Textos com altura automática: a altura guardada acompanha o conteúdo real.
  useEffect(() => {
    const nodes = stage.current?.querySelectorAll<HTMLElement>('[data-auto]');
    if (!nodes?.length) return;
    const ro = new ResizeObserver((entries) => {
      for (const en of entries) {
        const node = en.target as HTMLElement;
        const cur = useEditor.getState().project?.elements[node.dataset.id!];
        const h = Math.round(node.offsetHeight);
        if (cur && Math.abs(cur.height - h) >= 1) useEditor.getState().update(cur.id, { height: h }, false);
      }
    });
    nodes.forEach((n) => ro.observe(n));
    return () => ro.disconnect();
  }, [project.elements]);

  // Espaço + arrastar = mover a tela.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e.target)) return;
      e.preventDefault();
      space.current = true;
      setPanMode(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      space.current = false;
      setPanMode(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Arrastar, redimensionar e mover a tela.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const v = viewport.current;
      if (pan.current && v) {
        v.scrollLeft = pan.current.sl - (e.clientX - pan.current.sx);
        v.scrollTop = pan.current.st - (e.clientY - pan.current.sy);
        return;
      }
      const d = drag.current;
      if (!d) return;
      const { zoom: z, update, pushHistory, project: p } = useEditor.getState();
      const dx = (e.clientX - d.sx) / z;
      const dy = (e.clientY - d.sy) / z;
      if (!d.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        d.moved = true;
        pushHistory();
      }
      const free = e.ctrlKey || e.metaKey; // Ctrl desliga o alinhamento magnético
      const thr = SNAP / z;
      let x = d.ox, y = d.oy, w = d.ow, h = d.oh;

      if (d.mode === 'move') {
        x = d.ox + dx;
        y = d.oy + dy;
        if (!free) {
          x += nearest([x, x + w / 2, x + w], d.cands, 'x', thr);
          y += nearest([y, y + h / 2, y + h], d.cands, 'y', thr);
        }
      } else {
        const hd = d.handle ?? '';
        if (hd.includes('e')) w = d.ow + dx;
        if (hd.includes('s')) h = d.oh + dy;
        if (hd.includes('w')) { w = d.ow - dx; x = d.ox + dx; }
        if (hd.includes('n')) { h = d.oh - dy; y = d.oy + dy; }
        if (!free) {
          if (hd.includes('e')) w += nearest([x + w], d.cands, 'x', thr);
          if (hd.includes('w')) { const k = nearest([x], d.cands, 'x', thr); x += k; w -= k; }
          if (hd.includes('s')) h += nearest([y + h], d.cands, 'y', thr);
          if (hd.includes('n')) { const k = nearest([y], d.cands, 'y', thr); y += k; h -= k; }
        }
        if (w < MIN) { if (hd.includes('w')) x -= MIN - w; w = MIN; }
        if (h < MIN) { if (hd.includes('n')) y -= MIN - h; h = MIN; }
      }
      const r = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
      if (d.root) { r.x = Math.max(0, r.x); r.y = Math.max(0, r.y); }
      const patch: Record<string, unknown> = { x: r.x, y: r.y };
      if (d.mode === 'resize') {
        patch.width = r.w;
        patch.height = r.h;
        // Esticar um texto na vertical desliga a altura automática.
        if (p?.elements[d.id]?.type === 'text' && (d.handle ?? '').match(/[ns]/)) patch.autoHeight = false;
      }
      update(d.id, patch, false);
      setGuides(free ? [] : computeGuides(r, d.cands, d.origin));
    };
    const up = () => {
      drag.current = null;
      pan.current = null;
      setGuides([]);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  function startPan(e: ReactPointerEvent) {
    const v = viewport.current;
    if (!v || !(space.current || e.button === 1)) return;
    e.preventDefault();
    e.stopPropagation();
    pan.current = { sx: e.clientX, sy: e.clientY, sl: v.scrollLeft, st: v.scrollTop };
  }

  function onStageDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    const els = project.elements;
    const start = (id: string, mode: Drag['mode'], handle?: string) => {
      const el = els[id];
      const root = el.parentId === null;
      drag.current = {
        mode, id, handle, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.width, oh: el.height,
        origin: root ? { x: 0, y: 0 } : absolutePos(els, el.parentId!), cands: candidates(els, id, screens), root, moved: false,
      };
    };
    const screenId = (e.target as HTMLElement).closest<HTMLElement>('[data-screen]')?.dataset.screen;
    if (screenId) {
      select(screenId);
      start(screenId, 'move');
      return;
    }
    setHoverId(null);
    const handle = (e.target as HTMLElement).dataset.handle;
    if (handle && sel && sel.parentId) {
      start(sel.id, 'resize', handle);
      return;
    }
    const id = idFrom(e.target);
    select(id);
    if (!id || els[id].parentId === null || els[id].locked) return;
    start(id, 'move');
  }

  function onDragOver(e: DragEvent) {
    if (e.dataTransfer.types.includes('application/x-ui-lib')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function onDrop(e: DragEvent) {
    const item = LIBRARY.find((i) => i.id === e.dataTransfer.getData('application/x-ui-lib'));
    if (!item) return;
    e.preventDefault();
    // Solta dentro do frame mais próximo sob o cursor.
    let node = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
    while (node && project.elements[node.dataset.id!].type !== 'frame') {
      node = node.parentElement?.closest<HTMLElement>('[data-id]') ?? null;
    }
    if (!node) return;
    const rect = node.getBoundingClientRect();
    addSpec(item.build(), node.dataset.id, {
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top) / zoom),
    });
  }

  const inv = 1 / zoom;
  const box = (id: string) => absolutePos(project.elements, id);

  return (
    <div
      className={`viewport${panMode ? ' is-pan' : ''}`}
      ref={viewport}
      onPointerDownCapture={startPan}
      onPointerDown={(e) => { if (e.target === e.currentTarget) select(null); }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="stage-wrap" style={{ width: world.w * zoom, height: world.h * zoom }}>
        <div
          ref={stage}
          className="stage"
          style={{ width: world.w, height: world.h, transform: `scale(${zoom})` }}
          onPointerDown={onStageDown}
          onPointerMove={(e) => {
            if (drag.current || pan.current) return;
            const id = idFrom(e.target);
            setHoverId(id && project.elements[id]?.parentId !== null ? id : null);
          }}
          onPointerLeave={() => setHoverId(null)}
        >
          {screens.map((id) => {
            const r = project.elements[id];
            return (
              <div key={id}>
                <div
                  className={`stage-label${selectedId === id ? ' is-selected' : ''}`}
                  data-screen={id}
                  title="Arraste para mover a tela"
                  style={{ left: r.x, top: r.y, transform: `translateY(-100%) scale(${inv})`, transformOrigin: 'left bottom' }}
                >
                  {r.name} · {r.width} × {r.height}
                </div>
                <ElementView id={id} elements={project.elements} theme={theme} screens={screens} rootPlaced interactive />
              </div>
            );
          })}

          {hover && !hover.hidden && (
            <div className="hover-box" style={{ left: box(hover.id).x, top: box(hover.id).y, width: hover.width, height: hover.height, outlineWidth: inv }} />
          )}

          {sel && !sel.hidden && (
            <div className="selection" style={{ left: box(sel.id).x, top: box(sel.id).y, width: sel.width, height: sel.height, outlineWidth: 1.5 * inv }}>
              {sel.parentId !== null && !sel.locked &&
                Object.entries(HANDLES).map(([h, [px, py, cursor]]) => (
                  <i key={h} data-handle={h} className="handle" style={{ left: `${px}%`, top: `${py}%`, cursor, transform: `translate(-50%,-50%) scale(${inv})` }} />
                ))}
              <span className="selection-tag" style={{ transform: `scale(${inv})` }}>
                {sel.name} · {sel.width} × {sel.height}
              </span>
            </div>
          )}

          {guides.map((g, i) => (
            <div
              key={i}
              className="guide"
              style={g.o === 'v'
                ? { left: g.pos - inv / 2, top: g.from, width: inv, height: g.to - g.from }
                : { top: g.pos - inv / 2, left: g.from, height: inv, width: g.to - g.from }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

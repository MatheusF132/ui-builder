import { useEffect, useRef, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useEditor } from '../editor/store';
import { absolutePos } from '../editor/tree';
import { LIBRARY } from '../editor/library';
import { ElementView } from './ElementView';

const HANDLES = {
  nw: [0, 0, 'nwse-resize'], n: [50, 0, 'ns-resize'], ne: [100, 0, 'nesw-resize'], e: [100, 50, 'ew-resize'],
  se: [100, 100, 'nwse-resize'], s: [50, 100, 'ns-resize'], sw: [0, 100, 'nesw-resize'], w: [0, 50, 'ew-resize'],
} as const;

interface Drag {
  mode: 'move' | 'resize';
  id: string;
  handle?: string;
  sx: number; sy: number;
  ox: number; oy: number; ow: number; oh: number;
  moved: boolean;
}

const MIN = 8;
const idFrom = (t: EventTarget | null) => (t as HTMLElement | null)?.closest<HTMLElement>('[data-id]')?.dataset.id ?? null;

export function Canvas() {
  const project = useEditor((s) => s.project)!;
  const selectedId = useEditor((s) => s.selectedId);
  const zoom = useEditor((s) => s.zoom);
  const fitTick = useEditor((s) => s.fitTick);
  const { select, addSpec } = useEditor.getState();
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const root = project.elements[project.rootId];
  const sel = selectedId ? project.elements[selectedId] : null;

  // Ajusta o zoom para o projeto caber na área visível.
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const r = useEditor.getState().project!.elements[useEditor.getState().project!.rootId];
    const z = Math.min(1, (v.clientWidth - 160) / r.width, (v.clientHeight - 160) / r.height);
    useEditor.getState().setZoom(Math.round(z * 100) / 100);
  }, [fitTick]);

  // Ctrl + roda do mouse = zoom.
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const z = useEditor.getState().zoom;
      useEditor.getState().setZoom(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    v.addEventListener('wheel', onWheel, { passive: false });
    return () => v.removeEventListener('wheel', onWheel);
  }, []);

  // Arrastar e redimensionar.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const { zoom: z, update, pushHistory } = useEditor.getState();
      const dx = (e.clientX - d.sx) / z;
      const dy = (e.clientY - d.sy) / z;
      if (!d.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        d.moved = true;
        pushHistory();
      }
      if (d.mode === 'move') {
        update(d.id, { x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) }, false);
        return;
      }
      const h = d.handle ?? '';
      let x = d.ox, y = d.oy, w = d.ow, ht = d.oh;
      if (h.includes('e')) w = d.ow + dx;
      if (h.includes('s')) ht = d.oh + dy;
      if (h.includes('w')) { w = d.ow - dx; x = d.ox + dx; }
      if (h.includes('n')) { ht = d.oh - dy; y = d.oy + dy; }
      if (w < MIN) { if (h.includes('w')) x -= MIN - w; w = MIN; }
      if (ht < MIN) { if (h.includes('n')) y -= MIN - ht; ht = MIN; }
      update(d.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(ht) }, false);
    };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  function onStageDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    const els = project.elements;
    const handle = (e.target as HTMLElement).dataset.handle;
    if (handle && sel) {
      drag.current = { mode: 'resize', id: sel.id, handle, sx: e.clientX, sy: e.clientY, ox: sel.x, oy: sel.y, ow: sel.width, oh: sel.height, moved: false };
      return;
    }
    const id = idFrom(e.target);
    select(id);
    if (!id) return;
    const el = els[id];
    if (el.locked || id === project.rootId) return;
    drag.current = { mode: 'move', id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.width, oh: el.height, moved: false };
  }

  function onDragOver(e: DragEvent) {
    if (e.dataTransfer.types.includes('application/x-ui-lib')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function onDrop(e: DragEvent) {
    const libId = e.dataTransfer.getData('application/x-ui-lib');
    const item = LIBRARY.find((i) => i.id === libId);
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

  const pos = sel ? absolutePos(project.elements, sel.id) : null;
  const inv = 1 / zoom;

  return (
    <div
      className="viewport"
      ref={viewport}
      onPointerDown={(e) => { if (e.target === e.currentTarget) select(null); }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="stage-wrap" style={{ width: root.width * zoom, height: root.height * zoom }}>
        <div className="stage-label">{project.name} · {root.width} × {root.height}</div>
        <div
          className="stage"
          style={{ width: root.width, height: root.height, transform: `scale(${zoom})` }}
          onPointerDown={onStageDown}
        >
          <ElementView id={project.rootId} elements={project.elements} interactive />
          {sel && pos && !sel.hidden && (
            <div
              className="selection"
              style={{ left: pos.x, top: pos.y, width: sel.width, height: sel.height, outlineWidth: 1.5 * inv }}
            >
              {sel.id !== project.rootId && !sel.locked &&
                Object.entries(HANDLES).map(([h, [px, py, cursor]]) => (
                  <i
                    key={h}
                    data-handle={h}
                    className="handle"
                    style={{ left: `${px}%`, top: `${py}%`, cursor, transform: `translate(-50%,-50%) scale(${inv})` }}
                  />
                ))}
              <span className="selection-tag" style={{ transform: `scale(${inv})` }}>
                {sel.name} · {sel.width} × {sel.height}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

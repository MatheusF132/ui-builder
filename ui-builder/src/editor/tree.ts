import type { EditorElement } from './types';

export type Elements = Record<string, EditorElement>;

/** Descrição de um elemento (e dos filhos) antes de ganhar id. */
export type NodeSpec = Omit<Partial<EditorElement>, 'id' | 'parentId' | 'children'> & {
  type: EditorElement['type'];
  width: number;
  height: number;
  children?: NodeSpec[];
};

export function flatten(spec: NodeSpec, parentId: string | null, out: Elements = {}) {
  const { children = [], ...rest } = spec;
  const id = crypto.randomUUID();
  const el: EditorElement = { x: 0, y: 0, name: rest.type, ...rest, id, parentId, children: [] };
  out[id] = el;
  el.children = children.map((child) => flatten(child, id, out).id);
  return { id, elements: out };
}

export function cloneSubtree(elements: Elements, id: string, parentId: string | null, offset: number) {
  const added: Elements = {};
  const walk = (srcId: string, pid: string | null, top: boolean): string => {
    const src = elements[srcId];
    const newId = crypto.randomUUID();
    const children = src.children.map((c) => walk(c, newId, false));
    added[newId] = {
      ...src,
      id: newId,
      parentId: pid,
      x: top ? src.x + offset : src.x,
      y: top ? src.y + offset : src.y,
      children,
    };
    return newId;
  };
  return { id: walk(id, parentId, true), added };
}

export function collectIds(elements: Elements, id: string): string[] {
  return [id, ...elements[id].children.flatMap((c) => collectIds(elements, c))];
}

export function absolutePos(elements: Elements, id: string) {
  let x = 0;
  let y = 0;
  let el: EditorElement | undefined = elements[id];
  while (el) {
    x += el.x;
    y += el.y;
    el = el.parentId ? elements[el.parentId] : undefined;
  }
  return { x, y };
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * O frame `id` mudou de tamanho (ow×oh → nw×nh): reposiciona e redimensiona os filhos
 * de acordo com as restrições de cada um, descendo pela árvore quando um filho também muda.
 */
export function applyConstraints(elements: Elements, id: string, ow: number, oh: number, nw: number, nh: number): Elements {
  const out = { ...elements };
  const walk = (pid: string, w0: number, h0: number, w1: number, h1: number) => {
    const dw = w1 - w0;
    const dh = h1 - h0;
    const rw = w0 > 0 ? w1 / w0 : 1;
    const rh = h0 > 0 ? h1 / h0 : 1;
    for (const cid of out[pid].children) {
      const c = out[cid];
      const h = c.constraints?.h ?? 'left';
      const v = c.constraints?.v ?? 'top';
      let { x, y, width, height } = c;
      if (h === 'right') x += dw;
      else if (h === 'center') x += dw / 2;
      else if (h === 'stretch') width += dw;
      else if (h === 'scale') { x *= rw; width *= rw; }
      const fixedHeight = c.type === 'text' && c.autoHeight; // a altura do texto vem do conteúdo
      if (v === 'bottom') y += dh;
      else if (v === 'center') y += dh / 2;
      else if (v === 'stretch' && !fixedHeight) height += dh;
      else if (v === 'scale') { y *= rh; if (!fixedHeight) height *= rh; }
      const next = { ...c, x: r2(x), y: r2(y), width: Math.max(1, r2(width)), height: Math.max(1, r2(height)) };
      out[cid] = next;
      if (c.children.length && (next.width !== c.width || next.height !== c.height)) walk(cid, c.width, c.height, next.width, next.height);
    }
  };
  walk(id, ow, oh, nw, nh);
  return out;
}

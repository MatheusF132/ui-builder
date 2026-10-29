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

export function cloneSubtree(elements: Elements, id: string, parentId: string, offset: number) {
  const added: Elements = {};
  const walk = (srcId: string, pid: string, top: boolean): string => {
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
  while (el && el.parentId) {
    x += el.x;
    y += el.y;
    el = elements[el.parentId];
  }
  return { x, y };
}

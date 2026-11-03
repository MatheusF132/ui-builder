import type { Elements } from './tree';
import type { Project } from './types';

/** Projetos da v0.1–v0.3 têm uma única tela (rootId). */
export const getScreens = (project: Project): string[] => project.screens ?? [project.rootId];

/** Sobe pela árvore até a tela (elemento raiz) que contém o elemento. */
export function screenOf(elements: Elements, id: string): string | undefined {
  let el = elements[id];
  while (el?.parentId) el = elements[el.parentId];
  return el?.id;
}

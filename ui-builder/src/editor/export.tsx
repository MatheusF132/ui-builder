import { renderToStaticMarkup } from 'react-dom/server';
import { ElementView } from '../components/ElementView';
import type { Project } from './types';

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function exportHTML(project: Project) {
  const markup = renderToStaticMarkup(<ElementView id={project.rootId} elements={project.elements} />);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(project.name)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;display:flex;justify-content:center;background:#E7EAF0;font-family:system-ui,sans-serif}
@keyframes ub-spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
${markup}
</body>
</html>`;
}

export function exportJSON(project: Project) {
  return JSON.stringify({ app: 'ui-builder', version: 1, project }, null, 2);
}

export function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readProjectFile(file: File): Promise<Project> {
  const data = JSON.parse(await file.text());
  const p = data?.project;
  if (!p?.rootId || !p?.elements?.[p.rootId]) throw new Error('Arquivo inválido');
  return p as Project;
}

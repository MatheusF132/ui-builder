import { renderToStaticMarkup } from 'react-dom/server';
import { ElementView } from '../components/ElementView';
import type { Project } from './types';
import { FONT_STACKS, getTheme } from './theme';
import { getScreens } from './screens';

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function exportHTML(project: Project) {
  const theme = getTheme(project);
  const screens = getScreens(project);
  const sections = screens
    .map((id) => {
      const markup = renderToStaticMarkup(<ElementView id={id} elements={project.elements} theme={theme} screens={screens} />);
      const title = screens.length > 1 ? `<h2>${escapeHtml(project.elements[id].name)}</h2>` : '';
      return `<section>${title}${markup}</section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(project.name)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:24px;display:flex;flex-direction:column;align-items:center;gap:56px;background:#E7EAF0;font-family:${FONT_STACKS[theme.font]}}
section{display:flex;flex-direction:column;gap:12px}
h2{margin:0;font-size:14px;color:#5A6475}
@keyframes ub-spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
${sections}
</body>
</html>`;
}

/** HTML único e navegável: as interações definidas no editor funcionam como no modo protótipo. */
export function exportPrototype(project: Project) {
  const theme = getTheme(project);
  const screens = getScreens(project);
  const sections = screens
    .map((id, i) => {
      const el = project.elements[id];
      const markup = renderToStaticMarkup(<ElementView id={id} elements={project.elements} theme={theme} screens={screens} />);
      return `<section data-screen="${id}"${i ? ' hidden' : ''} style="width:${el.width}px;height:${el.height}px">${markup}</section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(project.name)} (protótipo)</title>
<style>
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden;background:#E7EAF0;font-family:${FONT_STACKS[theme.font]}}
section{position:fixed;left:50%;top:50%;transform-origin:center}
[data-link]{cursor:pointer}
@keyframes ub-spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
${sections}
<script>
const screens = [...document.querySelectorAll('[data-screen]')];
const stack = [screens[0].dataset.screen];
function fit() {
  const s = screens.find((x) => !x.hidden);
  const k = Math.min((innerWidth - 32) / s.offsetWidth, (innerHeight - 32) / s.offsetHeight, 1);
  s.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
}
function show() {
  const id = stack[stack.length - 1];
  screens.forEach((s) => { s.hidden = s.dataset.screen !== id; });
  fit();
}
document.addEventListener('click', (e) => {
  const node = e.target.closest('[data-link]');
  if (!node) return;
  const link = node.dataset.link;
  if (link === '$back') { if (stack.length > 1) stack.pop(); }
  else if (screens.some((s) => s.dataset.screen === link)) stack.push(link);
  show();
});
addEventListener('resize', fit);
show();
</script>
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

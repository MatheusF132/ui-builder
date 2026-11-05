import { contrastRatio, effectiveBackground, parseHex } from './contrast';
import { getTheme, resolveColor } from './theme';
import { getScreens, screenOf } from './screens';
import type { EditorElement, Project } from './types';

export interface Check { kind: 'contrast' | 'touch' | 'size'; ok: boolean; message: string }
export interface Issue { elementId: string; name: string; message: string }

const TEXTY = ['text', 'button', 'input', 'textarea', 'badge', 'avatar', 'checkbox'];
const TOUCH = ['button', 'input', 'textarea'];
const MIN_TOUCH = 44;

/** Checagens de UX de um elemento: contraste (WCAG AA), alvo de toque e tamanho de texto. */
export function checksFor(project: Project, el: EditorElement): Check[] {
  const theme = getTheme(project);
  const r = (v?: string) => resolveColor(v, theme);
  const fontSize = el.fontSize ?? 16;
  const checks: Check[] = [];

  if (TEXTY.includes(el.type) && !(el.type === 'avatar' && !el.text)) {
    if (el.state !== 'disabled') {
      const ownBg = ['button', 'input', 'textarea', 'badge', 'avatar'].includes(el.type) && parseHex(r(el.background));
      const bg = ownBg ? r(el.background) : effectiveBackground(project.elements, el.parentId, r);
      const fg = el.type === 'input' || el.type === 'textarea' ? (el.text ? r(el.color) : '#6B7587') : r(el.color);
      const ratio = contrastRatio(fg, bg);
      if (ratio !== null) {
        const large = fontSize >= 24 || (fontSize >= 18.66 && (el.fontWeight ?? 400) >= 700);
        const min = large ? 3 : 4.5;
        const ok = ratio >= min;
        checks.push({
          kind: 'contrast', ok,
          message: ok
            ? `Contraste ${ratio.toFixed(1)}:1. Atende ao mínimo recomendado (WCAG AA).`
            : `Contraste ${ratio.toFixed(1)}:1, abaixo do mínimo de ${min}:1. Escureça o texto ou clareie o fundo.`,
        });
      }
    }
    if (fontSize < 12) checks.push({ kind: 'size', ok: false, message: `Texto muito pequeno (${fontSize}px). Use pelo menos 12px.` });
  }

  if (project.target === 'mobile' && TOUCH.includes(el.type)) {
    const ok = el.width >= MIN_TOUCH && el.height >= MIN_TOUCH;
    checks.push({
      kind: 'touch', ok,
      message: ok
        ? `Alvo de toque de ${el.width}×${el.height}px (mínimo 44×44).`
        : `Alvo de toque pequeno (${el.width}×${el.height}px). O mínimo recomendado é 44×44px.`,
    });
  }
  return checks;
}

/** Problemas no fluxo entre telas (só avalia quando o projeto já tem alguma interação). */
function flowIssues(project: Project): Issue[] {
  const screens = getScreens(project);
  const els = project.elements;
  const linked = Object.values(els).filter((e) => e.link && !e.hidden);
  if (screens.length < 2 || !linked.length) return [];
  const issues: Issue[] = [];
  const incoming = new Set<string>();
  const outgoing = new Set<string>();
  for (const el of linked) {
    const from = screenOf(els, el.id);
    if (!from) continue;
    if (el.link === '$back') { outgoing.add(from); continue; }
    if (!els[el.link!]) {
      issues.push({ elementId: el.id, name: el.name, message: 'A interação leva a uma tela que não existe mais.' });
      continue;
    }
    outgoing.add(from);
    incoming.add(el.link!);
  }
  screens.forEach((id, i) => {
    const name = els[id].name;
    if (i > 0 && !incoming.has(id)) issues.push({ elementId: id, name, message: 'Nenhum elemento leva a esta tela, então ela não pode ser alcançada no protótipo.' });
    if (!outgoing.has(id)) issues.push({ elementId: id, name, message: 'Beco sem saída: nenhum elemento desta tela leva a outra tela.' });
  });
  return issues;
}

export function auditProject(project: Project): Issue[] {
  const issues: Issue[] = flowIssues(project);
  for (const el of Object.values(project.elements)) {
    if (el.hidden) continue;
    for (const c of checksFor(project, el)) if (!c.ok) issues.push({ elementId: el.id, name: el.name, message: c.message });
  }
  return issues;
}

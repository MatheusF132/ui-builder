import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { ArrowLeft, Download, RotateCcw, X } from 'lucide-react';
import { useEditor } from '../editor/store';
import { getScreens } from '../editor/screens';
import { getTheme } from '../editor/theme';
import { download, exportPrototype } from '../editor/export';
import { ElementView } from './ElementView';

/** Modo protótipo: navega entre as telas usando as interações definidas no inspetor. */
export function Prototype({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project)!;
  const theme = getTheme(project);
  const screens = getScreens(project);
  const first = useEditor.getState().activeScreen;
  const start = first && project.elements[first] ? first : screens[0];

  const [stack, setStack] = useState<string[]>([start]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState(false);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [onClose]);

  // Interruptores e checkboxes podem ser ligados e desligados durante o teste.
  const elements = useMemo(() => {
    const next = { ...project.elements };
    for (const [id, checked] of Object.entries(toggled)) if (next[id]) next[id] = { ...next[id], checked };
    return next;
  }, [project.elements, toggled]);

  const current = stack[stack.length - 1];
  const root = elements[current];
  const scale = Math.min((size.w - 64) / root.width, (size.h - 150) / root.height, 1.25);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  function onClick(e: MouseEvent) {
    let node = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
    while (node) {
      const el = elements[node.dataset.id!];
      if (el?.link === '$back') return back();
      if (el?.link && elements[el.link]) return setStack((s) => [...s, el.link!]);
      if (el && (el.type === 'switch' || el.type === 'checkbox')) {
        return setToggled((t) => ({ ...t, [el.id]: !el.checked }));
      }
      node = node.parentElement?.closest<HTMLElement>('[data-id]') ?? null;
    }
  }

  return (
    <div className="proto" role="dialog" aria-modal="true" aria-label="Modo protótipo">
      <div className="proto-bar">
        <button className="icon-btn" aria-label="Voltar para a tela anterior" title="Voltar" disabled={stack.length < 2} onClick={back}><ArrowLeft size={18} /></button>
        <button className="icon-btn" aria-label="Recomeçar" title="Recomeçar" onClick={() => { setStack([screens[0]]); setToggled({}); }}><RotateCcw size={17} /></button>
        <strong className="proto-title">{root.name}</strong>
        <label className="check">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} />
          Mostrar áreas clicáveis
        </label>
        <div className="spacer" />
        <button className="btn" onClick={() => download(`${project.name.trim().replace(/\s+/g, '-').toLowerCase() || 'projeto'}-prototipo.html`, exportPrototype(project), 'text/html')}>
          <Download size={16} /> Exportar protótipo
        </button>
        <button className="icon-btn" aria-label="Fechar o protótipo" title="Fechar (Esc)" onClick={onClose} autoFocus><X size={18} /></button>
      </div>
      <div className="proto-stage" onClick={onClick}>
        <div key={current} className={`proto-screen${hints ? ' show-hints' : ''}`} style={{ width: root.width * scale, height: root.height * scale }}>
          <div style={{ width: root.width, height: root.height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <ElementView id={current} elements={elements} theme={theme} screens={screens} prototype />
          </div>
        </div>
      </div>
    </div>
  );
}

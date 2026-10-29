import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, Trash2, TriangleAlert, CircleCheck } from 'lucide-react';
import { useEditor } from '../editor/store';
import { contrastRatio, effectiveBackground, parseHex } from '../editor/contrast';
import type { EditorElement, ElementState } from '../editor/types';

const TEXTY = ['text', 'button', 'input', 'textarea', 'badge', 'avatar', 'checkbox'];
const STATES: [ElementState, string][] = [
  ['normal', 'Normal'], ['hover', 'Hover'], ['disabled', 'Desabilitado'], ['loading', 'Carregando'], ['error', 'Erro'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Num({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="field num">
      <span>{label}</span>
      <input
        type="number" value={Math.round(value * 100) / 100} min={min} max={max}
        onChange={(e) => !Number.isNaN(e.target.valueAsNumber) && onChange(e.target.valueAsNumber)}
      />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <label className="field color">
      <span>{label}</span>
      <input
        type="color" aria-label={label} value={parseHex(value) ? value!.padEnd(7, '0').slice(0, 7) : '#000000'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
      <input type="text" aria-label={`${label} (código)`} value={value ?? ''} placeholder="transparente" onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Contrast({ el }: { el: EditorElement }) {
  const elements = useEditor((s) => s.project!.elements);
  if (!TEXTY.includes(el.type) || el.type === 'avatar' && !el.text) return null;
  const hasOwnBg = ['button', 'input', 'textarea', 'badge', 'avatar'].includes(el.type) && parseHex(el.background);
  const bg = hasOwnBg ? el.background : effectiveBackground(elements, el.parentId);
  const fg = el.type === 'input' || el.type === 'textarea' ? (el.text ? el.color : '#6B7587') : el.color;
  const ratio = contrastRatio(fg, bg);
  if (ratio === null) return null;
  const large = (el.fontSize ?? 16) >= 24 || ((el.fontSize ?? 16) >= 18.66 && (el.fontWeight ?? 400) >= 700);
  const min = large ? 3 : 4.5;
  const ok = ratio >= min;
  return (
    <Section title="Acessibilidade">
      <p className={`contrast ${ok ? 'ok' : 'warn'}`} role="status">
        {ok ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
        <span>
          Contraste {ratio.toFixed(1)}:1.{' '}
          {ok ? 'Atende ao mínimo recomendado (WCAG AA).' : `Abaixo do mínimo de ${min}:1. Escureça o texto ou clareie o fundo.`}
        </span>
      </p>
    </Section>
  );
}

export function Inspector() {
  const project = useEditor((s) => s.project)!;
  const selectedId = useEditor((s) => s.selectedId);
  const { update, remove, duplicate, reorder, setProjectName } = useEditor.getState();
  const el = selectedId ? project.elements[selectedId] : null;

  if (!el) {
    const root = project.elements[project.rootId];
    return (
      <aside className="inspector" aria-label="Propriedades">
        <Section title="Projeto">
          <label className="field">
            <span>Nome</span>
            <input type="text" value={project.name} onChange={(e) => setProjectName(e.target.value)} />
          </label>
          <p className="hint">{project.target === 'web' ? 'Web' : 'Celular'} · {root.width} × {root.height}</p>
        </Section>
        <p className="hint pad">Selecione um elemento no canvas ou nas camadas para editar suas propriedades.</p>
      </aside>
    );
  }

  const set = (patch: Partial<EditorElement>) => update(el.id, patch);
  const isRoot = el.parentId === null;
  const texty = TEXTY.includes(el.type);
  const stateful = ['button', 'input', 'textarea'].includes(el.type);
  const fillLabel = el.type === 'switch' || el.type === 'checkbox' ? 'Cor ativa' : el.type === 'progress' || el.type === 'slider' ? 'Cor da trilha' : 'Preenchimento';
  const colorLabel = texty ? 'Cor do texto' : 'Cor de destaque';

  return (
    <aside className="inspector" aria-label="Propriedades">
      <div className="insp-head">
        <input className="name-input" aria-label="Nome da camada" value={el.name} onChange={(e) => set({ name: e.target.value })} />
        {!isRoot && (
          <div className="insp-actions">
            <button className="icon-btn" aria-label="Trazer para frente" title="Trazer para frente" onClick={() => reorder(el.id, 1)}><ArrowUp size={16} /></button>
            <button className="icon-btn" aria-label="Enviar para trás" title="Enviar para trás" onClick={() => reorder(el.id, -1)}><ArrowDown size={16} /></button>
            <button className="icon-btn" aria-label="Duplicar" title="Duplicar (Ctrl+D)" onClick={() => duplicate(el.id)}><Copy size={16} /></button>
            <button className="icon-btn danger" aria-label="Excluir" title="Excluir (Delete)" onClick={() => remove(el.id)}><Trash2 size={16} /></button>
          </div>
        )}
      </div>

      <Section title="Posição e tamanho">
        <div className="grid2">
          {!isRoot && <Num label="X" value={el.x} onChange={(x) => set({ x })} />}
          {!isRoot && <Num label="Y" value={el.y} onChange={(y) => set({ y })} />}
          <Num label="Largura" value={el.width} min={1} onChange={(width) => set({ width })} />
          <Num label="Altura" value={el.height} min={1} onChange={(height) => set({ height })} />
        </div>
      </Section>

      {stateful && (
        <Section title="Estado">
          <div className="seg" role="group" aria-label="Estado do componente">
            {STATES.map(([value, label]) => (
              <button key={value} aria-pressed={(el.state ?? 'normal') === value} onClick={() => set({ state: value })}>{label}</button>
            ))}
          </div>
        </Section>
      )}

      {(texty || el.type === 'input') && (
        <Section title="Texto">
          <label className="field">
            <span>Conteúdo</span>
            <textarea rows={2} value={el.text ?? ''} onChange={(e) => set({ text: e.target.value })} />
          </label>
          {(el.type === 'input' || el.type === 'textarea') && (
            <label className="field">
              <span>Texto de apoio</span>
              <input type="text" value={el.placeholder ?? ''} onChange={(e) => set({ placeholder: e.target.value })} />
            </label>
          )}
          <div className="grid2">
            <Num label="Tamanho" value={el.fontSize ?? 16} min={8} max={200} onChange={(fontSize) => set({ fontSize })} />
            <label className="field">
              <span>Peso</span>
              <select value={el.fontWeight ?? 400} onChange={(e) => set({ fontWeight: Number(e.target.value) })}>
                <option value={400}>Regular</option><option value={600}>Semibold</option><option value={700}>Bold</option><option value={800}>Extra bold</option>
              </select>
            </label>
          </div>
          {el.type === 'text' && (
            <div className="seg" role="group" aria-label="Alinhamento">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button key={a} aria-pressed={(el.textAlign ?? 'left') === a} onClick={() => set({ textAlign: a })}>
                  {a === 'left' ? 'Esquerda' : a === 'center' ? 'Centro' : 'Direita'}
                </button>
              ))}
            </div>
          )}
        </Section>
      )}

      {(el.type === 'progress' || el.type === 'slider') && (
        <Section title="Valor">
          <label className="field">
            <span>{el.value ?? 0}%</span>
            <input type="range" min={0} max={100} value={el.value ?? 0} onChange={(e) => set({ value: Number(e.target.value) })} />
          </label>
        </Section>
      )}

      {(el.type === 'switch' || el.type === 'checkbox') && (
        <Section title="Valor">
          <label className="check">
            <input type="checkbox" checked={!!el.checked} onChange={(e) => set({ checked: e.target.checked })} />
            Marcado
          </label>
        </Section>
      )}

      <Section title="Aparência">
        {el.type !== 'text' && el.type !== 'spinner' && <ColorField label={fillLabel} value={el.background} onChange={(background) => set({ background })} />}
        {(texty || ['progress', 'slider', 'spinner'].includes(el.type)) && <ColorField label={colorLabel} value={el.color} onChange={(color) => set({ color })} />}
        <div className="grid2">
          <Num label="Arredondamento" value={el.radius ?? 0} min={0} onChange={(radius) => set({ radius })} />
          <Num label="Borda" value={el.borderWidth ?? 0} min={0} onChange={(borderWidth) => set({ borderWidth })} />
        </div>
        {!!el.borderWidth && <ColorField label="Cor da borda" value={el.borderColor ?? '#CBD2DE'} onChange={(borderColor) => set({ borderColor })} />}
        <label className="field">
          <span>Opacidade {Math.round((el.opacity ?? 1) * 100)}%</span>
          <input type="range" min={0} max={100} value={Math.round((el.opacity ?? 1) * 100)} onChange={(e) => set({ opacity: Number(e.target.value) / 100 })} />
        </label>
        <label className="field">
          <span>Sombra</span>
          <select value={el.shadow ?? 'none'} onChange={(e) => set({ shadow: e.target.value as EditorElement['shadow'] })}>
            <option value="none">Nenhuma</option><option value="sm">Pequena</option><option value="md">Média</option><option value="lg">Grande</option>
          </select>
        </label>
      </Section>

      <Contrast el={el} />
    </aside>
  );
}

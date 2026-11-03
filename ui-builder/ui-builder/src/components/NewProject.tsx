import { useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useEditor } from '../editor/store';
import { PRESETS } from '../editor/presets';
import { LIBRARY } from '../editor/library';
import { readProjectFile } from '../editor/export';
import type { Target } from '../editor/types';
import { Preview } from './Library';

const OPTIONS: { target: Target; title: string; text: string; Icon: typeof Monitor }[] = [
  { target: 'web', title: 'Web', text: 'Sites, painéis e sistemas para navegador.', Icon: Monitor },
  { target: 'mobile', title: 'Celular', text: 'Telas de aplicativo para Android e iPhone.', Icon: Smartphone },
];

const find = (id: string) => LIBRARY.find((i) => i.id === id)!;

export function NewProject() {
  const { createProject, loadProject } = useEditor.getState();
  const [target, setTarget] = useState<Target>('web');
  const [presetIndex, setPresetIndex] = useState(0);
  const [name, setName] = useState('Meu projeto');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const preset = PRESETS[target][presetIndex];

  async function onImport(file?: File) {
    if (!file) return;
    try {
      loadProject(await readProjectFile(file));
    } catch {
      setError('Não foi possível abrir o arquivo. Use um .json exportado pelo UI Builder.');
    }
  }

  return (
    <main className="new">
      <section className="new-form">
        <div className="brand">UI Builder</div>
        <h1>Projete telas para web e celular.</h1>
        <p className="lead">Escolha onde o projeto vai rodar. Os tamanhos de tela e a biblioteca já se ajustam a essa escolha, e você pode editar tudo depois.</p>

        <div className="targets" role="radiogroup" aria-label="Plataforma">
          {OPTIONS.map(({ target: t, title, text, Icon }) => (
            <button
              key={t} role="radio" aria-checked={target === t} className="target"
              onClick={() => { setTarget(t); setPresetIndex(0); }}
            >
              <Icon size={26} aria-hidden />
              <strong>{title}</strong>
              <span>{text}</span>
            </button>
          ))}
        </div>

        <div className="seg wide" role="group" aria-label="Tamanho da tela">
          {PRESETS[target].map((p, i) => (
            <button key={p.label} aria-pressed={presetIndex === i} onClick={() => setPresetIndex(i)}>
              {p.label}<small>{p.width} × {p.height}</small>
            </button>
          ))}
        </div>

        <label className="field">
          <span>Nome do projeto</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="new-actions">
          <button className="btn primary big" onClick={() => createProject(name.trim() || 'Meu projeto', target, preset.width, preset.height)}>
            Criar projeto
          </button>
          <button className="btn big" onClick={() => fileInput.current?.click()}>Abrir arquivo .json</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="hint">O projeto é salvo automaticamente neste navegador.</p>
      </section>

      <section className="collage" aria-hidden>
        <div className="c1"><Preview item={find('modelos:tela-de-login')} width={300} height={380} /></div>
        <div className="c2"><Preview item={find('cards:card-com-imagem')} width={240} height={250} /></div>
        <div className="c3"><Preview item={find('navegacao:abas')} width={260} height={50} /></div>
        <div className="c4"><Preview item={find('botoes:primario')} width={160} height={50} /></div>
        <div className="c5"><Preview item={find('feedback:barra-de-progresso')} width={220} height={20} /></div>
      </section>
    </main>
  );
}

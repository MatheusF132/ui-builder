import { useRef } from 'react';
import { FileCode2, FileJson, FolderOpen, Keyboard, Maximize, Monitor, Moon, Palette, Plus, Sun, SquarePlus, Redo2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { useEditor } from '../editor/store';
import { useUi, type UiMode } from '../editor/ui';
import { download, exportHTML, exportJSON, readProjectFile } from '../editor/export';

export function TopBar({ onHelp }: { onHelp: () => void }) {
  const project = useEditor((s) => s.project)!;
  const zoom = useEditor((s) => s.zoom);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const { undo, redo, setZoom, requestFit, closeProject, loadProject, select, addScreen } = useEditor.getState();
  const mode = useUi((s) => s.mode);
  const NEXT: Record<UiMode, UiMode> = { light: 'dark', dark: 'auto', auto: 'light' };
  const ModeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const MODE_LABEL: Record<UiMode, string> = { light: 'claro', dark: 'escuro', auto: 'automático' };
  const fileInput = useRef<HTMLInputElement>(null);
  const fileName = project.name.trim().replace(/\s+/g, '-').toLowerCase() || 'projeto';

  async function onImport(file?: File) {
    if (!file) return;
    try {
      loadProject(await readProjectFile(file));
    } catch {
      alert('Não foi possível abrir o arquivo. Use um .json exportado pelo UI Builder.');
    }
  }

  return (
    <header className="topbar">
      <div className="brand">UI Builder</div>
      <input className="project-name" aria-label="Nome do projeto" value={project.name} onChange={(e) => useEditor.getState().setProjectName(e.target.value)} />
      <div className="spacer" />

      <div className="group">
        <button className="icon-btn" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!canUndo} onClick={undo}><Undo2 size={17} /></button>
        <button className="icon-btn" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}><Redo2 size={17} /></button>
      </div>
      <div className="group">
        <button className="icon-btn" aria-label="Diminuir zoom" onClick={() => setZoom(zoom / 1.2)}><ZoomOut size={17} /></button>
        <span className="zoom-label" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button className="icon-btn" aria-label="Aumentar zoom" onClick={() => setZoom(zoom * 1.2)}><ZoomIn size={17} /></button>
        <button className="icon-btn" aria-label="Ajustar à tela" title="Ajustar à tela" onClick={requestFit}><Maximize size={17} /></button>
      </div>
      <div className="group">
        <button className="btn" title="Adicionar uma tela ao projeto" onClick={addScreen}><SquarePlus size={16} /> Tela</button>
        <button className="btn" title="Editar o tema do projeto" onClick={() => select(null)}><Palette size={16} /> Tema</button>
        <button className="btn" onClick={() => download(`${fileName}.html`, exportHTML(project), 'text/html')}><FileCode2 size={16} /> HTML</button>
        <button className="btn" onClick={() => download(`${fileName}.json`, exportJSON(project), 'application/json')}><FileJson size={16} /> JSON</button>
        <button className="btn" onClick={() => fileInput.current?.click()}><FolderOpen size={16} /> Abrir</button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <button
        className="icon-btn" aria-label={`Tema do editor: ${MODE_LABEL[mode]}. Clique para alternar`} title={`Tema do editor: ${MODE_LABEL[mode]}`}
        onClick={() => useUi.getState().setMode(NEXT[mode])}
      ><ModeIcon size={18} /></button>
      <button className="icon-btn" aria-label="Atalhos de teclado" title="Atalhos de teclado (?)" onClick={onHelp}><Keyboard size={18} /></button>
      <button
        className="btn primary"
        onClick={() => {
          if (confirm('Começar um novo projeto? O projeto atual será descartado. Exporte o JSON antes se quiser guardá-lo.')) closeProject();
        }}
      >
        <Plus size={16} /> Novo projeto
      </button>
    </header>
  );
}

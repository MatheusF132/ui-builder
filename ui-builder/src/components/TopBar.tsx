import { useRef } from 'react';
import { FileCode2, FileJson, FolderOpen, Maximize, Plus, Redo2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { useEditor } from '../editor/store';
import { download, exportHTML, exportJSON, readProjectFile } from '../editor/export';

export function TopBar() {
  const project = useEditor((s) => s.project)!;
  const zoom = useEditor((s) => s.zoom);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const { undo, redo, setZoom, requestFit, closeProject, loadProject } = useEditor.getState();
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
        <button className="btn" onClick={() => download(`${fileName}.html`, exportHTML(project), 'text/html')}><FileCode2 size={16} /> HTML</button>
        <button className="btn" onClick={() => download(`${fileName}.json`, exportJSON(project), 'application/json')}><FileJson size={16} /> JSON</button>
        <button className="btn" onClick={() => fileInput.current?.click()}><FolderOpen size={16} /> Abrir</button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
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

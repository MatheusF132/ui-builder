import { useEffect } from 'react';
import { X } from 'lucide-react';

const ITEMS: [string, string][] = [
  ['Ctrl + Z · Ctrl + Shift + Z', 'Desfazer · refazer'],
  ['Ctrl + D', 'Duplicar o elemento'],
  ['Delete', 'Excluir o elemento'],
  ['Setas (Shift = 10 px)', 'Mover o elemento'],
  ['Espaço + arrastar', 'Mover a tela (ou use o botão do meio do mouse)'],
  ['Ctrl + roda do mouse', 'Zoom'],
  ['Ctrl ao arrastar', 'Desativar as guias de alinhamento'],
  ['Esc', 'Limpar a seleção'],
  ['?', 'Abrir ou fechar esta lista'],
];

export function Shortcuts({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="shortcuts-title">Atalhos de teclado</h2>
          <button className="icon-btn" aria-label="Fechar" onClick={onClose} autoFocus><X size={18} /></button>
        </div>
        <dl>
          {ITEMS.map(([keys, label]) => (
            <div key={keys}>
              <dt><kbd>{keys}</kbd></dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

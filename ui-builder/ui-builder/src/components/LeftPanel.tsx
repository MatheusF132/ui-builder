import { useState } from 'react';
import { Layers } from './Layers';
import { Library } from './Library';

export function LeftPanel() {
  const [tab, setTab] = useState<'library' | 'layers'>('library');
  return (
    <aside className="left" aria-label="Componentes e camadas">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'library'} onClick={() => setTab('library')}>Componentes</button>
        <button role="tab" aria-selected={tab === 'layers'} onClick={() => setTab('layers')}>Camadas</button>
      </div>
      <div className="left-body">{tab === 'library' ? <Library /> : <Layers />}</div>
    </aside>
  );
}

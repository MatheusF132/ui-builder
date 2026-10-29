import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATEGORIES, LIBRARY, type LibItem } from '../editor/library';
import { flatten } from '../editor/tree';
import { useEditor } from '../editor/store';
import { ElementView } from './ElementView';

/** Miniatura real do componente (renderizado com o mesmo ElementView do canvas). */
export function Preview({ item, width = 112, height = 64 }: { item: LibItem; width?: number; height?: number }) {
  const { id, elements } = useMemo(() => flatten(item.build(), null), [item]);
  const root = elements[id];
  const scale = Math.min(1, width / root.width, height / root.height);
  return (
    <div className="preview" style={{ width, height }}>
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', width: root.width, height: root.height,
          transform: `translate(-50%,-50%) scale(${scale})`,
        }}
      >
        <ElementView id={id} elements={elements} />
      </div>
    </div>
  );
}

export function Library() {
  const addSpec = useEditor((s) => s.addSpec);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = LIBRARY.filter((i) => `${i.name} ${i.category}`.toLowerCase().includes(q));

  return (
    <div className="lib">
      <label className="search">
        <Search size={15} aria-hidden />
        <input
          type="search"
          placeholder="Buscar componente"
          aria-label="Buscar componente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="hint">Clique para adicionar ou arraste para o canvas.</p>
      {CATEGORIES.map((cat) => {
        const list = items.filter((i) => i.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat}>
            <h3>{cat}</h3>
            <div className="lib-grid">
              {list.map((item) => (
                <button
                  key={item.id}
                  className="lib-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-ui-lib', item.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => addSpec(item.build())}
                >
                  <Preview item={item} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {!items.length && <p className="hint">Nenhum componente encontrado para “{query}”.</p>}
    </div>
  );
}

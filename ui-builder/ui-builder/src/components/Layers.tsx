import {
  AlignLeft, Eye, EyeOff, Image as ImageIcon, Loader, Lock, LockOpen, Minus, RectangleHorizontal,
  SlidersHorizontal, Square, Tag, TextCursorInput, ToggleLeft, SquareCheck, Type, User,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEditor } from '../editor/store';
import type { ElementType } from '../editor/types';

const ICONS: Record<ElementType, ComponentType<{ size?: number }>> = {
  frame: Square, text: Type, button: RectangleHorizontal, input: TextCursorInput, textarea: AlignLeft,
  image: ImageIcon, divider: Minus, progress: Minus, spinner: Loader, switch: ToggleLeft,
  checkbox: SquareCheck, slider: SlidersHorizontal, badge: Tag, avatar: User,
};

function Row({ id, depth }: { id: string; depth: number }) {
  const el = useEditor((s) => s.project!.elements[id]);
  const selected = useEditor((s) => s.selectedId === id);
  const select = useEditor((s) => s.select);
  const update = useEditor((s) => s.update);
  const Icon = ICONS[el.type];
  const isRoot = el.parentId === null;

  return (
    <>
      <div
        className={`layer${selected ? ' is-selected' : ''}${el.hidden ? ' is-hidden' : ''}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => select(id)}
      >
        <Icon size={14} />
        <span className="layer-name">{el.name}</span>
        {!isRoot && (
          <span className="layer-actions">
            <button
              className="icon-btn small"
              aria-label={el.locked ? 'Destravar camada' : 'Travar camada'}
              onClick={(e) => { e.stopPropagation(); update(id, { locked: !el.locked }); }}
            >
              {el.locked ? <Lock size={13} /> : <LockOpen size={13} />}
            </button>
            <button
              className="icon-btn small"
              aria-label={el.hidden ? 'Mostrar camada' : 'Ocultar camada'}
              onClick={(e) => { e.stopPropagation(); update(id, { hidden: !el.hidden }); }}
            >
              {el.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </span>
        )}
      </div>
      {[...el.children].reverse().map((c) => (
        <Row key={c} id={c} depth={depth + 1} />
      ))}
    </>
  );
}

export function Layers() {
  const rootId = useEditor((s) => s.project!.rootId);
  return (
    <div className="layers">
      <Row id={rootId} depth={0} />
    </div>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import type { EditorElement } from '../editor/types';

const SHADOWS = {
  none: 'none',
  sm: '0 1px 3px rgba(20,28,45,.16)',
  md: '0 6px 18px rgba(20,28,45,.14)',
  lg: '0 18px 44px rgba(20,28,45,.20)',
};

interface Props {
  id: string;
  elements: Record<string, EditorElement>;
  /** No editor: adiciona data-id e cursores. Na exportação: HTML limpo. */
  interactive?: boolean;
}

function MiniSpinner({ color }: { color?: string }) {
  return (
    <span
      style={{
        width: 16, height: 16, borderRadius: '50%', display: 'inline-block',
        border: '2px solid rgba(128,128,128,.35)', borderTopColor: color ?? '#fff',
        animation: 'ub-spin .8s linear infinite',
      }}
    />
  );
}

export function ElementView({ id, elements, interactive }: Props) {
  const el = elements[id];
  if (!el || el.hidden) return null;

  const isRoot = el.parentId === null;
  const state = el.state ?? 'normal';
  const opacity = el.opacity ?? 1;
  const center: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  let style: CSSProperties = {
    position: isRoot ? 'relative' : 'absolute',
    left: isRoot ? 0 : el.x,
    top: isRoot ? 0 : el.y,
    width: el.width,
    height: el.height,
    boxSizing: 'border-box',
    opacity,
    boxShadow: SHADOWS[el.shadow ?? 'none'],
    background: el.background,
    color: el.color,
    borderRadius: el.radius,
    border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor ?? '#CBD2DE'}` : undefined,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    cursor: interactive ? (isRoot ? 'default' : el.locked ? 'not-allowed' : 'move') : undefined,
  };
  let content: ReactNode = null;

  switch (el.type) {
    case 'frame':
      style = { ...style, overflow: 'hidden' };
      break;

    case 'text':
      style = {
        ...style, display: 'flex', alignItems: 'center', textAlign: el.textAlign,
        justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
        lineHeight: 1.35, whiteSpace: 'pre-wrap',
      };
      content = el.text;
      break;

    case 'button':
      style = { ...style, ...center, gap: 8, textAlign: 'center', cursor: interactive ? style.cursor : 'pointer' };
      if (state === 'hover') style = { ...style, filter: 'brightness(.9)', boxShadow: SHADOWS.md };
      if (state === 'disabled') style = { ...style, opacity: opacity * 0.5, filter: 'grayscale(.4)', cursor: interactive ? style.cursor : 'not-allowed' };
      if (state === 'loading') style = { ...style, opacity: opacity * 0.85 };
      if (state === 'error') style = { ...style, border: '2px solid #D13B3B' };
      content = (<>{state === 'loading' && <MiniSpinner color={el.color} />}{el.text}</>);
      break;

    case 'input':
    case 'textarea': {
      const empty = !el.text;
      style = {
        ...style, display: 'flex', overflow: 'hidden', whiteSpace: 'pre-wrap',
        alignItems: el.type === 'input' ? 'center' : 'flex-start',
        padding: el.type === 'input' ? '0 12px' : 12,
        color: empty ? '#6B7587' : el.color,
      };
      if (state === 'hover') style.border = `${el.borderWidth ?? 1}px solid #8892A6`;
      if (state === 'error') style.border = '2px solid #D13B3B';
      if (state === 'disabled') style = { ...style, background: '#EEF0F5', opacity: opacity * 0.7 };
      content = empty ? el.placeholder : el.text;
      break;
    }

    case 'image':
      style = { ...style, ...center, overflow: 'hidden', background: el.background ?? 'linear-gradient(135deg,#DCE1F2,#C3CBE6)' };
      content = (
        <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#8A95BE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-4.5-4.5L6 21" />
        </svg>
      );
      break;

    case 'progress':
      style = { ...style, overflow: 'hidden' };
      content = <div style={{ width: `${el.value ?? 0}%`, height: '100%', background: el.color, borderRadius: el.radius }} />;
      break;

    case 'spinner':
      style = {
        ...style, background: undefined, borderRadius: '50%',
        border: `${Math.max(3, el.width / 8)}px solid rgba(27,34,48,.12)`,
        borderTopColor: el.color, animation: 'ub-spin .8s linear infinite',
      };
      break;

    case 'switch':
      style = { ...style, background: el.checked ? el.background : '#8892A6', borderRadius: el.height / 2 };
      content = (
        <div style={{
          position: 'absolute', top: 3, width: el.height - 6, height: el.height - 6, borderRadius: '50%',
          background: '#fff', left: el.checked ? el.width - el.height + 3 : 3, boxShadow: SHADOWS.sm,
        }} />
      );
      break;

    case 'checkbox':
      style = { ...style, background: undefined, display: 'flex', alignItems: 'center', gap: 10 };
      content = (
        <>
          <span style={{
            ...center, width: 20, height: 20, borderRadius: 6, flexShrink: 0, boxSizing: 'border-box',
            background: el.checked ? el.background : '#fff',
            border: `2px solid ${el.checked ? el.background : '#8892A6'}`,
          }}>
            {el.checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 7.5" /></svg>
            )}
          </span>
          {el.text}
        </>
      );
      break;

    case 'slider': {
      const v = el.value ?? 0;
      style = { ...style, background: undefined };
      content = (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: el.height / 2 - 3, height: 6, borderRadius: 3, background: el.background }} />
          <div style={{ position: 'absolute', left: 0, width: `${v}%`, top: el.height / 2 - 3, height: 6, borderRadius: 3, background: el.color }} />
          <div style={{
            position: 'absolute', top: el.height / 2 - 10, left: `calc(${v}% - 10px)`, width: 20, height: 20,
            borderRadius: '50%', background: '#fff', border: `2px solid ${el.color}`, boxSizing: 'border-box',
          }} />
        </>
      );
      break;
    }

    case 'badge':
      style = { ...style, ...center };
      content = el.text;
      break;

    case 'avatar':
      style = { ...style, ...center, borderRadius: el.radius ?? '50%' };
      content = el.text;
      break;

    case 'divider':
      break;
  }

  return (
    <div data-id={interactive ? id : undefined} style={style}>
      {content}
      {el.children.map((c) => (
        <ElementView key={c} id={c} elements={elements} interactive={interactive} />
      ))}
    </div>
  );
}

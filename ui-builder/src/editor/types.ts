export type Target = 'web' | 'mobile';

export type ElementType =
  | 'frame' | 'text' | 'button' | 'input' | 'textarea' | 'image' | 'divider'
  | 'progress' | 'spinner' | 'switch' | 'checkbox' | 'slider' | 'badge' | 'avatar';

export type ElementState = 'normal' | 'hover' | 'disabled' | 'loading' | 'error';

export type HConstraint = 'left' | 'right' | 'center' | 'stretch' | 'scale';
export type VConstraint = 'top' | 'bottom' | 'center' | 'stretch' | 'scale';

export interface EditorElement {
  id: string;
  type: ElementType;
  name: string;
  parentId: string | null;
  children: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  placeholder?: string;
  background?: string;
  color?: string;
  radius?: number;
  borderWidth?: number;
  borderColor?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  /** Texto: a altura acompanha o conteúdo (útil para parágrafos e títulos). */
  autoHeight?: boolean;
  opacity?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  value?: number;
  checked?: boolean;
  state?: ElementState;
  hidden?: boolean;
  locked?: boolean;
  /** Interação: id da tela de destino ao clicar, ou "$back" para voltar. */
  link?: string;
  /** Como o elemento reage quando o frame que o contém muda de tamanho. Padrão: esquerda e topo. */
  constraints?: { h: HConstraint; v: VConstraint };
}

export interface Project {
  name: string;
  target: Target;
  rootId: string;
  elements: Record<string, EditorElement>;
  /** Projetos da v0.1 não têm tema; use getTheme(). */
  theme?: Theme;
  /** Telas do projeto, em ordem (cada uma é um elemento raiz). Use getScreens(). */
  screens?: string[];
}

export type ThemeColor =
  | 'primary' | 'onPrimary' | 'soft' | 'onSoft' | 'ink' | 'muted'
  | 'line' | 'surface' | 'alt' | 'danger' | 'success';

export interface Theme {
  colors: Record<ThemeColor, string>;
  font: 'manrope' | 'system' | 'serif' | 'mono';
  roundness: 'none' | 'soft' | 'round';
}

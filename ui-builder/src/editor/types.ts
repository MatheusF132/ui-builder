export type Target = 'web' | 'mobile';

export type ElementType =
  | 'frame' | 'text' | 'button' | 'input' | 'textarea' | 'image' | 'divider'
  | 'progress' | 'spinner' | 'switch' | 'checkbox' | 'slider' | 'badge' | 'avatar';

export type ElementState = 'normal' | 'hover' | 'disabled' | 'loading' | 'error';

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
  opacity?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  value?: number;
  checked?: boolean;
  state?: ElementState;
  hidden?: boolean;
  locked?: boolean;
}

export interface Project {
  name: string;
  target: Target;
  rootId: string;
  elements: Record<string, EditorElement>;
}

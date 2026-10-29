import type { NodeSpec } from './tree';

export interface LibItem {
  id: string;
  name: string;
  category: string;
  build: () => NodeSpec;
}

type O = Partial<NodeSpec>;

const INK = '#1B2230';
const MUTED = '#5A6475';
const LINE = '#CBD2DE';
const ACCENT = '#3A4BFF';

const text = (t: string, o: O = {}): NodeSpec => ({
  type: 'text', name: 'Texto', width: 220, height: 28, text: t, fontSize: 16, color: INK, ...o,
});
const button = (t: string, o: O = {}): NodeSpec => ({
  type: 'button', name: 'Botão', width: 148, height: 44, text: t, background: ACCENT,
  color: '#FFFFFF', radius: 10, fontSize: 15, fontWeight: 600, ...o,
});
const input = (placeholder: string, o: O = {}): NodeSpec => ({
  type: 'input', name: 'Campo de texto', width: 280, height: 44, placeholder, background: '#FFFFFF',
  color: INK, radius: 10, borderWidth: 1, borderColor: LINE, fontSize: 15, ...o,
});
const frame = (o: O & { width: number; height: number }, children: NodeSpec[] = []): NodeSpec => ({
  type: 'frame', name: 'Frame', background: '#FFFFFF', ...o, children,
});
const image = (o: O = {}): NodeSpec => ({ type: 'image', name: 'Imagem', width: 240, height: 150, radius: 12, ...o });
const avatar = (t: string, o: O = {}): NodeSpec => ({
  type: 'avatar', name: 'Avatar', width: 48, height: 48, text: t, background: '#DDE1FF',
  color: '#2A36B8', fontWeight: 700, fontSize: 16, ...o,
});

export const CATEGORIES = ['Básicos', 'Botões', 'Formulários', 'Feedback', 'Navegação', 'Cards', 'Modelos'];

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
const item = (category: string, name: string, build: () => NodeSpec): LibItem => ({
  id: `${slug(category)}:${slug(name)}`, category, name, build,
});

const alert = (msg: string, bg: string, border: string, fg: string, name: string) =>
  frame({ name, width: 320, height: 56, background: bg, radius: 10, borderWidth: 1, borderColor: border }, [
    text(msg, { x: 16, y: 14, width: 288, fontSize: 14, color: fg, fontWeight: 600 }),
  ]);

export const LIBRARY: LibItem[] = [
  item('Básicos', 'Frame', () => frame({ width: 240, height: 160, background: '#F1F3F8', radius: 12 })),
  item('Básicos', 'Título', () => text('Título da seção', { name: 'Título', fontSize: 28, fontWeight: 700, width: 320, height: 40 })),
  item('Básicos', 'Parágrafo', () => text('Escreva aqui um texto de apoio para explicar a seção.', { name: 'Parágrafo', color: MUTED, width: 320, height: 48 })),
  item('Básicos', 'Imagem', () => image()),
  item('Básicos', 'Divisor', () => ({ type: 'divider', name: 'Divisor', width: 240, height: 1, background: LINE })),
  item('Básicos', 'Avatar', () => avatar('AB', { radius: 24 })),

  item('Botões', 'Primário', () => button('Salvar alterações', { width: 168 })),
  item('Botões', 'Secundário', () => button('Cancelar', { background: '#E8EBF2', color: INK })),
  item('Botões', 'Contorno', () => button('Ver detalhes', { background: 'transparent', color: ACCENT, borderWidth: 2, borderColor: ACCENT })),
  item('Botões', 'Fantasma', () => button('Saiba mais', { background: 'transparent', color: ACCENT })),
  item('Botões', 'Perigo', () => button('Excluir conta', { background: '#C62F2F', width: 160 })),
  item('Botões', 'Sucesso', () => button('Confirmar', { background: '#12794B' })),
  item('Botões', 'Carregando', () => button('Enviando', { state: 'loading', name: 'Botão carregando' })),
  item('Botões', 'Desabilitado', () => button('Indisponível', { state: 'disabled', name: 'Botão desabilitado' })),

  item('Formulários', 'Campo de texto', () => input('Seu e-mail')),
  item('Formulários', 'Campo com erro', () => input('Seu e-mail', { text: 'maria@', state: 'error', name: 'Campo com erro' })),
  item('Formulários', 'Área de texto', () => ({ ...input('Escreva sua mensagem'), type: 'textarea', name: 'Área de texto', height: 110 })),
  item('Formulários', 'Checkbox', () => ({ type: 'checkbox', name: 'Checkbox', width: 200, height: 24, text: 'Lembrar de mim', checked: true, color: INK, background: ACCENT, fontSize: 15 })),
  item('Formulários', 'Interruptor', () => ({ type: 'switch', name: 'Interruptor', width: 44, height: 24, checked: true, background: ACCENT })),
  item('Formulários', 'Slider', () => ({ type: 'slider', name: 'Slider', width: 240, height: 24, value: 60, background: '#D6DBE6', color: ACCENT })),

  item('Feedback', 'Barra de progresso', () => ({ type: 'progress', name: 'Barra de progresso', width: 240, height: 10, value: 65, background: '#E3E7EF', color: ACCENT, radius: 5 })),
  item('Feedback', 'Spinner', () => ({ type: 'spinner', name: 'Spinner', width: 32, height: 32, color: ACCENT })),
  item('Feedback', 'Alerta de sucesso', () => alert('Alterações salvas com sucesso.', '#E3F6EC', '#9BD8B8', '#0D5B38', 'Alerta de sucesso')),
  item('Feedback', 'Alerta de erro', () => alert('Não foi possível salvar. Tente de novo.', '#FBE6E6', '#EBA9A9', '#8C1F1F', 'Alerta de erro')),
  item('Feedback', 'Badge', () => ({ type: 'badge', name: 'Badge', width: 72, height: 24, text: 'Novo', background: '#DDE1FF', color: '#2A36B8', radius: 12, fontSize: 12, fontWeight: 600 })),
  item('Feedback', 'Toast', () => frame({ name: 'Toast', width: 300, height: 52, background: INK, radius: 12, shadow: 'md' }, [
    text('Link copiado', { x: 16, y: 12, width: 160, color: '#FFFFFF', fontSize: 14 }),
    button('Desfazer', { x: 196, y: 8, width: 92, height: 36, background: 'transparent', color: '#AEB7FF', fontSize: 14 }),
  ])),

  item('Navegação', 'Barra de navegação (web)', () => frame({ name: 'Barra de navegação', width: 960, height: 64, shadow: 'sm' }, [
    text('Marca', { x: 24, y: 18, width: 120, fontSize: 20, fontWeight: 800 }),
    text('Produtos', { x: 360, y: 18, width: 90, fontSize: 15, color: MUTED }),
    text('Preços', { x: 470, y: 18, width: 90, fontSize: 15, color: MUTED }),
    text('Contato', { x: 580, y: 18, width: 90, fontSize: 15, color: MUTED }),
    button('Entrar', { x: 820, y: 10, width: 116, height: 44 }),
  ])),
  item('Navegação', 'Cabeçalho (celular)', () => frame({ name: 'Cabeçalho', width: 360, height: 56, borderWidth: 1, borderColor: '#E3E7EF' }, [
    text('←', { x: 16, y: 12, width: 32, fontSize: 22 }),
    text('Título da tela', { x: 60, y: 14, width: 240, fontWeight: 700, textAlign: 'center' }),
  ])),
  item('Navegação', 'Barra de abas (celular)', () => frame({ name: 'Barra de abas', width: 360, height: 64, borderWidth: 1, borderColor: '#E3E7EF' }, [
    text('Início', { x: 0, y: 18, width: 90, fontSize: 13, fontWeight: 700, color: '#2A36B8', textAlign: 'center' }),
    text('Buscar', { x: 90, y: 18, width: 90, fontSize: 13, color: MUTED, textAlign: 'center' }),
    text('Pedidos', { x: 180, y: 18, width: 90, fontSize: 13, color: MUTED, textAlign: 'center' }),
    text('Perfil', { x: 270, y: 18, width: 90, fontSize: 13, color: MUTED, textAlign: 'center' }),
  ])),
  item('Navegação', 'Abas', () => frame({ name: 'Abas', width: 320, height: 44, background: '#EEF0F5', radius: 12 }, [
    button('Geral', { x: 4, y: 4, width: 152, height: 36, background: '#FFFFFF', color: INK, radius: 9, shadow: 'sm' }),
    button('Detalhes', { x: 164, y: 4, width: 152, height: 36, background: 'transparent', color: MUTED, radius: 9 }),
  ])),

  item('Cards', 'Card simples', () => frame({ name: 'Card', width: 280, height: 160, radius: 16, shadow: 'md', borderWidth: 1, borderColor: '#E3E7EF' }, [
    text('Título do card', { x: 20, y: 20, width: 240, fontSize: 18, fontWeight: 700 }),
    text('Uma descrição curta que explica o que o card oferece.', { x: 20, y: 54, width: 240, height: 40, fontSize: 14, color: MUTED }),
    button('Abrir', { x: 20, y: 104, width: 96, height: 40 }),
  ])),
  item('Cards', 'Card com imagem', () => frame({ name: 'Card com imagem', width: 280, height: 300, radius: 16, shadow: 'md', borderWidth: 1, borderColor: '#E3E7EF' }, [
    image({ width: 280, height: 140, radius: 0 }),
    text('Título do card', { x: 20, y: 156, width: 240, fontSize: 18, fontWeight: 700 }),
    text('Uma descrição curta que explica o que o card oferece.', { x: 20, y: 190, width: 240, height: 40, fontSize: 14, color: MUTED }),
    button('Ver mais', { x: 20, y: 244, width: 110, height: 40 }),
  ])),
  item('Cards', 'Item de lista', () => frame({ name: 'Item de lista', width: 320, height: 72, radius: 12, borderWidth: 1, borderColor: '#E3E7EF' }, [
    avatar('AB', { x: 16, y: 12, width: 48, height: 48, radius: 24 }),
    text('Nome da pessoa', { x: 76, y: 14, width: 200, fontWeight: 700 }),
    text('Descrição curta', { x: 76, y: 38, width: 200, height: 22, fontSize: 13, color: MUTED }),
    text('›', { x: 284, y: 20, width: 24, fontSize: 24, color: MUTED }),
  ])),

  item('Modelos', 'Tela de login', () => frame({ name: 'Login', width: 360, height: 470, radius: 20, shadow: 'lg' }, [
    text('Entrar', { x: 32, y: 32, width: 296, height: 40, fontSize: 28, fontWeight: 800 }),
    text('Use seu e-mail e sua senha.', { x: 32, y: 76, width: 296, fontSize: 15, color: MUTED }),
    input('E-mail', { x: 32, y: 128, width: 296 }),
    input('Senha', { x: 32, y: 188, width: 296 }),
    { type: 'checkbox', name: 'Lembrar de mim', x: 32, y: 252, width: 200, height: 24, text: 'Lembrar de mim', checked: true, color: INK, background: ACCENT, fontSize: 15 },
    button('Entrar', { x: 32, y: 300, width: 296 }),
    button('Esqueci minha senha', { x: 32, y: 360, width: 296, background: 'transparent', color: ACCENT }),
  ])),
  item('Modelos', 'Seção de abertura (web)', () => frame({ name: 'Seção de abertura', width: 960, height: 420, background: '#F1F3F8' }, [
    text('Projete telas que as pessoas entendem à primeira vista.', { x: 64, y: 90, width: 520, height: 120, fontSize: 44, fontWeight: 800 }),
    text('Monte páginas e aplicativos com componentes prontos e exporte o resultado.', { x: 64, y: 226, width: 460, height: 56, fontSize: 18, color: MUTED }),
    button('Começar agora', { x: 64, y: 306, width: 168, height: 48 }),
    button('Ver exemplos', { x: 248, y: 306, width: 150, height: 48, background: 'transparent', color: ACCENT, borderWidth: 2, borderColor: ACCENT }),
    image({ x: 600, y: 80, width: 300, height: 260, radius: 20 }),
  ])),
  item('Modelos', 'Perfil (celular)', () => frame({ name: 'Perfil', width: 360, height: 520, radius: 20, shadow: 'lg' }, [
    avatar('AB', { x: 136, y: 40, width: 88, height: 88, radius: 44, fontSize: 30 }),
    text('Maria Souza', { x: 40, y: 144, width: 280, height: 32, fontSize: 22, fontWeight: 800, textAlign: 'center' }),
    text('maria@email.com', { x: 40, y: 178, width: 280, fontSize: 14, color: MUTED, textAlign: 'center' }),
    { type: 'divider', name: 'Divisor', x: 32, y: 228, width: 296, height: 1, background: LINE },
    text('Notificações', { x: 32, y: 254, width: 200, fontWeight: 600 }),
    { type: 'switch', name: 'Interruptor', x: 284, y: 252, width: 44, height: 24, checked: true, background: ACCENT },
    button('Editar perfil', { x: 32, y: 340, width: 296 }),
    button('Sair', { x: 32, y: 400, width: 296, background: 'transparent', color: '#C62F2F', borderWidth: 2, borderColor: '#C62F2F' }),
  ])),
];

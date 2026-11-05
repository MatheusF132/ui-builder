# UI Builder

Editor visual para projetar a **interface e a experiência (UI e UX)** de **web** e **celular**, mais simples que as ferramentas de design tradicionais e pensado para qualquer nível: de quem está começando a quem trabalha com design todo dia.

Ao criar o projeto você escolhe a plataforma (Web ou Celular) e o tamanho da tela. Depois é só montar a interface com a biblioteca de componentes prontos, ajustar tudo no inspetor e exportar.

## O que já funciona

- **Várias telas** no mesmo projeto: adicione, duplique, exclua e arraste as telas no canvas (com guias de alinhamento entre elas)
- **Restrições (constraints)**: cada elemento define como reage quando o frame muda de tamanho (esquerda, direita, centro, esticar, proporcional). Os modelos já vêm configurados, e dá pra trocar o tamanho da tela ou criar uma versão em outro dispositivo e o conteúdo se adapta
- **Fluxo e protótipo**: defina "ao clicar, ir para tal tela" em qualquer elemento, veja as setas de fluxo no canvas e teste tudo no modo protótipo (com interruptores e checkboxes funcionando). Dá pra exportar o protótipo navegável em um único HTML
- **Tema do editor**: claro, escuro ou automático, com a cor de destaque acompanhando o tema do projeto
- **Novo projeto** com escolha de plataforma e tamanhos prontos (Desktop, Notebook, Tablet, iPhone, Android)
- **Biblioteca com 36 componentes** em 7 categorias: básicos, botões, formulários, feedback, navegação, cards e modelos completos (login, seção de abertura, perfil), com miniaturas reais e busca
- **Canvas** com arrastar, redimensionar por 8 alças, zoom (botões ou Ctrl + roda do mouse), ajuste à tela e mover a tela com Espaço + arrastar
- **Guias inteligentes** em vermelho: o elemento gruda e mostra as linhas quando alinha com bordas e centros do frame e dos outros elementos (Ctrl desativa)
- **Revisão de UX** automática: contraste (WCAG AA), alvos de toque (mínimo 44×44 no celular) e tamanho mínimo de texto, por elemento e no projeto inteiro
- **Soltar da biblioteca** direto dentro do frame desejado
- **Camadas** em árvore, com ocultar e travar
- **Inspetor** de propriedades: posição, tamanho, texto, cores, borda, arredondamento, opacidade e sombra
- **Estados dos componentes** (normal, hover, desabilitado, carregando, erro) editáveis sem refazer o desenho
- **Tema global**: escolha um tema pronto ou gere a paleta inteira a partir de uma única cor (o contraste do texto é ajustado sozinho), e troque fonte e arredondamento do projeto todo. Os componentes usam as cores do tema, então tudo muda junto
- **Desfazer/refazer** com histórico
- **Salvamento automático** no navegador
- **Exportar** para HTML e JSON, e abrir projetos `.json`

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

Outros comandos: `npm run build` (gera a versão de produção) e `npm run lint`.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl + Z` / `Ctrl + Shift + Z` | Desfazer / refazer |
| `Ctrl + D` | Duplicar elemento |
| `Delete` | Excluir elemento |
| Setas (`Shift` = 10 px) | Mover elemento |
| `Esc` | Limpar seleção |
| `Espaço` + arrastar | Mover a tela |
| `Ctrl` ao arrastar | Desativar as guias de alinhamento |
| `?` | Lista de atalhos |
| `Ctrl + roda do mouse` | Zoom |

## Estrutura

```
src/
  editor/        núcleo: tipos, store (zustand), biblioteca, exportação, contraste
  components/    interface: canvas, painéis, inspetor, barra superior, tela inicial
```

Tudo o que aparece no canvas é uma árvore de elementos guardada no store. O canvas, as miniaturas e a exportação HTML usam o mesmo componente de renderização (`ElementView`), então o que você vê é o que sai no arquivo.

## Tecnologias

React, TypeScript, Vite, Zustand e Lucide Icons.

## Roadmap

O objetivo é ser também uma ferramenta de UX, não só de desenho de telas:

- [x] Várias telas no mesmo projeto
- [x] Conexões entre as telas (fluxo de navegação)
- [x] Modo protótipo: clicar nos elementos e navegar entre as telas
- [ ] Mapa de jornada do usuário e personas
- [x] Constraints: o conteúdo de um frame acompanha o redimensionamento
- [ ] Responsividade nativa: cada componente com comportamento por tamanho de tela, sem desenhar um frame por breakpoint
- [x] Tema global (cores, fonte e arredondamento do projeto inteiro em um clique)
- [ ] Exportar código limpo em React e React Native
- [ ] Mais componentes e modelos de fluxos completos (checkout, onboarding, painel)
- [ ] Layout automático (auto layout) e alinhamento/distribuição
- [ ] Pré-visualização no celular real via QR code
- [ ] Colaboração em tempo real
- [ ] Conta de usuário e projetos na nuvem

## Licença

[MIT](LICENSE)

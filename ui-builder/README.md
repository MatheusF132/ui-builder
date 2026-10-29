# UI Builder

Editor visual para projetar interfaces de **web** e **celular**, mais simples que as ferramentas de design tradicionais e pensado para qualquer nível: de quem está começando a quem trabalha com design todo dia.

Ao criar o projeto você escolhe a plataforma (Web ou Celular) e o tamanho da tela. Depois é só montar a interface com a biblioteca de componentes prontos, ajustar tudo no inspetor e exportar.

## O que já funciona

- **Novo projeto** com escolha de plataforma e tamanhos prontos (Desktop, Notebook, Tablet, iPhone, Android)
- **Biblioteca com 36 componentes** em 7 categorias: básicos, botões, formulários, feedback, navegação, cards e modelos completos (login, seção de abertura, perfil), com miniaturas reais e busca
- **Canvas** com arrastar, redimensionar por 8 alças, zoom (botões ou Ctrl + roda do mouse) e ajuste à tela
- **Soltar da biblioteca** direto dentro do frame desejado
- **Camadas** em árvore, com ocultar e travar
- **Inspetor** de propriedades: posição, tamanho, texto, cores, borda, arredondamento, opacidade e sombra
- **Estados dos componentes** (normal, hover, desabilitado, carregando, erro) editáveis sem refazer o desenho
- **Verificador de contraste** (WCAG AA) em tempo real para textos
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

- [ ] Responsividade nativa: cada componente com comportamento por tamanho de tela, sem desenhar um frame por breakpoint
- [ ] Tema global (cores, fontes e bordas do projeto inteiro em um clique)
- [ ] Exportar código limpo em React e React Native
- [ ] Mais componentes e modelos de fluxos completos (checkout, onboarding, painel)
- [ ] Layout automático (auto layout) e alinhamento/distribuição
- [ ] Pré-visualização no celular real via QR code
- [ ] Colaboração em tempo real
- [ ] Conta de usuário e projetos na nuvem

## Licença

[MIT](LICENSE)

# Design TODO — Sistema Eventos ("Hórus")

> Checklist de melhorias de design, derivado da auditoria (`/audit`) com telas reais.
> Score atual: **12/20 (Aceitável)**. Meta: **17–18/20**.
> Queixa-base do usuário: *"está grosseiro, com pouca cara de app, quero proporções melhores e mais amigável aos olhos."*

## Progresso

| Bloco | Status |
|---|---|
| **Parte 1 — `/layout`** (Profundidade & proporção) | ✅ **Concluído** — commit `ed98469`, deploy prod em https://sistema-eventos-eosin.vercel.app |
| **Parte 2 — `/colorize`** (contraste de texto) | ✅ **Concluído** — tokens `--fe-text-muted`/`--fe-text-faint` AA + token `--fe-icon` |
| Parte 3 — `/typeset` (tipografia) | ⬜ |
| Parte 4 — `/adapt` (responsividade) | ⬜ |
| Parte 5 — `/clarify` (acessibilidade) | ⬜ |
| Parte 6 — `/quieter` → `/delight` → `/polish` (acabamento) | ⬜ |

> Convenção: `[x]` = feito e verificado em preview. Não refazer itens marcados.

## Princípio norteador (decisão do usuário)

**Manter o fundo branco `#FFFFFF`.** As referências aprovadas (KokonutUI, ClickUp) são brancas.
A "cara de app" NÃO vem de tingir o fundo de cinza — vem da **estrutura**:

> **borda + cantos arredondados + padding generoso + espaçamento + hierarquia tipográfica**

Hoje o sistema é branco *plano* (tudo edge-to-edge separado por linhas de 1px = cara de planilha).
A meta é branco *estruturado* (conteúdo dentro de cards bordados e arejados, como o KokonutUI).

---

## 🎯 P1 — Resolvem a queixa "grosseiro / pouca cara de app"

### ✅ Profundidade & proporção → `/layout` — CONCLUÍDO (commit `ed98469`)
Arquivos mexidos: `DataList.tsx`, `cells.tsx`, `inline.tsx`, `types.ts`, `configs/clientes.ts`, `configs/eventos.ts`
(`kit.tsx` `Row`/`ColunasHeader` são legados — a lista viva é renderizada pelos internos de `DataList.tsx`)
- [x] Manter `#FFFFFF`, mas envelopar listas e painéis em **card com borda 1px + `--fe-radius-xl` (14px) + padding** (estilo KokonutUI) — tabela agora vive num card bordado e arejado
- [x] Usar `--fe-shadow-card` (já existe no token, nunca era usado) de forma sutil no card da lista
- [x] Aumentar gutters → **24px internos** (conteúdo ~48px da borda da viewport, com o respiro do card)
- [x] Coluna "Cliente" flexível (`minmax(150px,0.7fr)`) — e corrigida a causa-raiz do `T…`: o wrapper `inline-flex` das células de menu (relation/select/multiselect/date) encolhia ao conteúdo; novo prop `fill` faz a célula preencher a coluna e o ellipsis truncar na largura certa
- [x] Trocar parte dos divisores de 1px por **espaçamento** (divisores de linha suavizados p/ `--fe-divider`, borda da toolbar removida)
- [x] Variar o ritmo vertical: **gap branco acima de cada cabeçalho de grupo** (exceto o primeiro)
- [x] Itens de lista no estilo do print: ícone + 2 linhas (título + subtítulo) — novo `column.subtitle` (opt-in) no motor; aplicado em **Clientes** (avatar + nome + empresa), removendo a coluna Empresa redundante. Lists que não declaram `subtitle` seguem em 1 linha.

### Tipografia → `/typeset`
Arquivo: `src/app/globals.css`
- [ ] Subir base de **13,5px → 14px**
- [ ] Line-height de conteúdo para **~1,55**
- [ ] Abrir a escala (mais contraste entre passos, razão ≥1,25)
- [ ] Nome da Task na linha em **14–15px**

### ✅ Contraste de texto → `/colorize` — CONCLUÍDO
Arquivos: `src/app/globals.css` (tokens) + reatribuição de glifos decorativos em `kit.tsx`, `Sidebar.tsx`, `FolderView.tsx`, `FullRecord.tsx`, `NewRecordForm.tsx`, `TaskActivity.tsx`, `TaskAttachments.tsx`
- [x] Escurecer `--fe-text-muted` (#9499A1 ≈ 2,9:1) → **#6A707E (4,96:1)** — passa **WCAG AA** para texto normal; sincronizado `--muted-foreground` do shadcn
- [x] Escurecer `--fe-text-faint` (#B5B8BE ≈ 2,0:1) → **#868C99 (3,37:1)** — AA para texto grande/secundário (metadados, timestamps, cabeçalhos de coluna)
- [x] Reservar o cinza mais claro só para ícones decorativos: novo token **`--fe-icon` (#B0B4BD)**, aplicado aos separadores `/`, dashes `—`, avatar tracejado, ícone de empty-state e strokes de SVG decorativos
- [x] (Opcional, bem sutil) neutros de texto inclinados levemente ao índigo/cool (B>R) — superfícies `#FFFFFF` intactas

### Responsividade → `/adapt`
Arquivos: `src/components/shell/Sidebar.tsx`, `kit.tsx`, `FullPage`
- [ ] Adicionar breakpoints (hoje há **zero** media queries)
- [ ] Sidebar colapsável abaixo de ~1024px
- [ ] Corrigir overlap de breadcrumb/cabeçalhos em telas estreitas
- [ ] Tabela com scroll-x contido dentro do card
- [ ] Touch targets ≥ 36–44px; ações de linha visíveis no toque (hoje só no hover)

### Acessibilidade → `/clarify`
Arquivos: `DataList.tsx`, inputs do `kit.tsx`
- [ ] Linhas como `<button>`/`role="button"` + `tabIndex` + Enter (hoje `<div onClick>` = sem teclado)
- [ ] Restaurar anel de foco visível em inputs e botões de ícone (`outline:none` removeu)
- [ ] `aria-label` nos botões só-ícone que faltam

---

## 🔧 P2 — Acabamento que tira o ar de "inacabado"
- [ ] Aliviar placeholders grandes (descrição e dropzone de anexos) → `/delight`
- [x] Aplicar o sistema de elevação (sombras já definidas, mas não usadas nas listas) → `/layout` — `--fe-shadow-card` agora aplicada no card da lista (feito junto da Parte 1)
- [ ] Promover cores hard-coded a tokens: `AVATAR_PALETTE`, avatar `#6B59C9`, scrollbar `#D8DADE/#C2C5CB` → `/colorize`
- [ ] Calmar o log de Histórico: tirar fonte mono + chips roxos nas datas, destacar por peso → `/quieter`

---

## ✨ P3 — Polimento final
- [ ] Avaliar dark mode no futuro (Linear é escuro; `@custom-variant dark` já declarado sem valores) → `/colorize`
- [ ] Passada final de alinhamento, espaçamento e consistência → `/polish`

---

## ✅ Já está bom (manter)
- [x] Fundo branco `#FFFFFF` — preferência confirmada, alinhada às referências
- [x] Sem nenhum tell de "design de IA" (paleta e formas intencionais)
- [x] Status pills corretos (tint + texto escuro da mesma cor)
- [x] Motor config-driven (uma correção no `kit.tsx` propaga para todas as Lists)
- [x] Save otimista, empty states com CTA, ocultar campos
- [x] Card "Detalhes" da tela de Task — já tem cara de app; é o modelo a estender ao resto

---

## Sequência sugerida
1. ✅ ~~`/layout` — cards bordados + raio + padding + respiro (maior impacto)~~ — **feito**
2. ✅ ~~`/colorize` — corrigir contraste do texto secundário~~ — **feito**
3. `/typeset` — base 14px + hierarquia ← **próximo**
4. `/adapt` — responsividade
5. `/clarify` — acessibilidade
6. `/quieter` → `/delight` → `/polish` — acabamento

Os 3 primeiros resolvem ~80% da sensação. Rodar `/audit` de novo após cada bloco para acompanhar o score.

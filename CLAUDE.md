@AGENTS.md

# Sistema Eventos

Sistema interno de gestão de eventos da Future Events.

**Stack:** Next.js (App Router) + Supabase + Tailwind CSS.

## Convenções

- Use **sempre** o vocabulário do ClickUp no código, na UI e nas conversas:
  - **Space** — agrupador de mais alto nível (Comercial, Entregas, Gestão, Marketing). Fixo no código.
  - **Folder** — agrupador dentro de um Space (ex.: Projetos, Base de dados). Fixo no código.
  - **List** — coleção de itens com comportamento, campos e automações próprios (ex.: Eventos, Clientes). Implementada via o motor config-driven.
  - **View** — uma forma de visualizar os itens de uma List (lista/tabela, board, calendário). Uma List pode ter várias Views.
  - **Task** — o item universal: cada linha de qualquer List é uma Task.
  - **Custom field** — campo personalizado de uma List/Folder/Space, declarado na config daquela List.
- **Regra de ouro:** todo item de qualquer List é uma **Task**. Cliente, fornecedor, evento, tarefa de pré-evento — é tudo Task. As Lists diferem só pelos custom fields, automações e exceções de anatomia.
- Roteie cada List em `/[space]/[folder]/[list]` (ex.: `/entregas/base-de-dados/eventos`).
- Para QUALQUER tela/componente/view nova, herde a identidade visual via a skill `future-events-design`.

## Proibido

- Nunca crie tabelas `space` ou `folder` no banco — Spaces e Folders existem só como navegação no código.
- Nunca reimplemente a anatomia da Task por List — a anatomia é entregue pelo motor; cada List declara só o que difere.
- Nunca commite nem dê push de segredos, tokens ou senhas. `.env*` é gitignored; só `.env.example` é versionado.

## Particularidades do projeto

- A anatomia padrão da Task é entregue pelo motor de Lists em `src/components/list`; cada List só declara seus custom fields, automações e exceções na config.
- Tabela `evento` no Supabase ↔ List **Eventos** (Folder Base de dados, Space Entregas).
- Tabela `cliente` no Supabase ↔ List **Clientes** (Folder Gestão de clientes, Space Comercial).
- Lists podem se comunicar entre si (automações) e Tasks podem ter relacionamentos entre si.

## Onde encontrar

- Arquitetura completa (anatomia da Task, árvore Space→Folder→List, fatias): `.claude/arquitetura.md`
- Design visual / tokens: skill `future-events-design`
- Índice da documentação: `.claude/index.md`
- Regras do Next.js deste repo: `AGENTS.md`

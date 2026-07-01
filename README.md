# Sistema Eventos

Sistema interno de gestão de eventos da **Future Events**, no vocabulário do ClickUp
(Space → Folder → List → View → Task).

**Stack:** Next.js (App Router) + Supabase + Tailwind CSS.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Variáveis de ambiente: copie `.env.example` para `.env.local` e preencha as chaves do
Supabase. Nunca commite `.env*` (já está no `.gitignore`).

## Documentação

- Contexto e regras: [`CLAUDE.md`](./CLAUDE.md)
- Arquitetura completa: [`.claude/arquitetura.md`](./.claude/arquitetura.md)
- Índice da documentação: [`.claude/index.md`](./.claude/index.md)

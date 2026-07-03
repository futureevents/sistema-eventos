import { createAdminClient } from '@/lib/supabase/admin'

/** Client admin (service_role) — a autorização já foi feita pelo token. */
export const admin = () => createAdminClient()

// ── Respostas padrão das tools ──────────────────────────────────────────────

type ToolResult = {
  content: { type: 'text'; text: string }[]
  isError?: boolean
}

export function texto(s: string): ToolResult {
  return { content: [{ type: 'text', text: s }] }
}

/** Erro acionável: a mensagem + uma dica de como resolver. */
export function erro(msg: string, dica?: string): ToolResult {
  return {
    content: [{ type: 'text', text: dica ? `❌ ${msg}\n\n💡 ${dica}` : `❌ ${msg}` }],
    isError: true,
  }
}

/** Embrulha o handler de uma tool: qualquer exceção vira erro acionável. */
export function tool<A>(fn: (args: A) => Promise<ToolResult>) {
  return async (args: A): Promise<ToolResult> => {
    try {
      return await fn(args)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return erro(`Falha ao executar: ${msg}`, 'Tente de novo; se persistir, avise o suporte do sistema.')
    }
  }
}

// ── Datas ───────────────────────────────────────────────────────────────────

/**
 * Normaliza data para o formato do banco (timestamp sem fuso).
 * "2026-07-10" (só dia) → "2026-07-10T00:00:00" (meia-noite = sem hora).
 */
export function normalizarData(s?: string | null): string | null {
  if (!s) return null
  const t = s.trim()
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return `${t}T00:00:00`
  return t
}

/** Formata ISO para exibição em pt-BR; meia-noite mostra só o dia. */
export function fmtData(iso?: string | null): string {
  if (!iso) return '—'
  const [data, resto = ''] = iso.split('T')
  const p = data.split('-')
  if (p.length !== 3) return iso
  const dia = `${p[2]}/${p[1]}/${p[0]}`
  const hora = resto.slice(0, 5)
  return hora && hora !== '00:00' ? `${dia} ${hora}` : dia
}

// ── Resolvers ────────────────────────────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type MembroRef = { id: string; nome: string; email: string }

/** Resolve um membro por e-mail exato ou por nome (parcial). */
export async function resolveMembro(texto: string): Promise<MembroRef | null> {
  const a = admin()
  const alvo = texto.trim()
  const porEmail = await a.from('membros').select('id, nome, email').ilike('email', alvo).limit(1)
  if (porEmail.data?.[0]) return porEmail.data[0] as MembroRef
  const porNome = await a.from('membros').select('id, nome, email').ilike('nome', `%${alvo}%`).limit(1)
  return (porNome.data?.[0] as MembroRef | undefined) ?? null
}

export type EventoRef = { id: string; nome: string; status: string }

/** Resolve um evento por id (uuid) ou por nome (parcial). */
export async function resolveEvento(texto: string): Promise<EventoRef | null> {
  const a = admin()
  const alvo = texto.trim()
  if (UUID.test(alvo)) {
    const { data } = await a.from('evento').select('id, nome, status').eq('id', alvo).maybeSingle()
    return (data as EventoRef | null) ?? null
  }
  const { data } = await a.from('evento').select('id, nome, status').ilike('nome', `%${alvo}%`).limit(1)
  return (data?.[0] as EventoRef | undefined) ?? null
}

export function ehUuid(s: string): boolean {
  return UUID.test(s.trim())
}

export type ClienteRef = { id: string; nome: string }

/** Resolve um cliente por id (uuid) ou por nome/razão social (parcial). */
export async function resolveCliente(txt: string): Promise<ClienteRef | null> {
  const a = admin()
  const alvo = txt.trim()
  if (UUID.test(alvo)) {
    const { data } = await a.from('cliente').select('id, nome').eq('id', alvo).maybeSingle()
    return (data as ClienteRef | null) ?? null
  }
  const { data } = await a
    .from('cliente')
    .select('id, nome')
    .or(`nome.ilike.%${alvo}%,razao_social.ilike.%${alvo}%`)
    .limit(1)
  return (data?.[0] as ClienteRef | undefined) ?? null
}

export type FornecedorRef = { id: string; nome: string }

/** Resolve um fornecedor por id (uuid) ou por nome (parcial). */
export async function resolveFornecedor(txt: string): Promise<FornecedorRef | null> {
  const a = admin()
  const alvo = txt.trim()
  if (UUID.test(alvo)) {
    const { data } = await a.from('fornecedor').select('id, nome').eq('id', alvo).maybeSingle()
    return (data as FornecedorRef | null) ?? null
  }
  const { data } = await a.from('fornecedor').select('id, nome').ilike('nome', `%${alvo}%`).limit(1)
  return (data?.[0] as FornecedorRef | undefined) ?? null
}

export type TaskRef = { id: string; nome: string }

/**
 * Resolve uma task de QUALQUER List (tabela) por id (uuid) ou por nome (parcial).
 * Devolve TODAS as que casam pelo nome — quem chama decide o que fazer com
 * ambiguidade (ex.: apagar exige match único). Toda List tem coluna `nome`.
 */
export async function resolveTasks(table: string, txt: string): Promise<TaskRef[]> {
  const a = admin()
  const alvo = txt.trim()
  if (UUID.test(alvo)) {
    const { data } = await a.from(table).select('id, nome').eq('id', alvo).maybeSingle()
    return data ? [data as TaskRef] : []
  }
  const { data } = await a
    .from(table)
    .select('id, nome')
    .ilike('nome', `%${alvo}%`)
    .order('nome', { ascending: true })
    .limit(10)
  return (data as TaskRef[] | null) ?? []
}

// Annotations padrão (reaproveitadas pelas tools da Onda 2).
export const ANOT_READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
export const ANOT_WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
/** Ações que apagam dados de verdade — o cliente MCP deve pedir confirmação. */
export const ANOT_DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }

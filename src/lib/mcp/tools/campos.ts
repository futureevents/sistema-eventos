import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  admin, texto, erro, tool, normalizarData, ehUuid,
  resolveMembro, resolveCliente, resolveEvento, resolveFornecedor, resolveTasks,
  ANOT_READ, ANOT_WRITE,
} from '../helpers'
import { markdownToHtml } from '@/lib/richtext'
import type { FieldDef, FieldType, ListConfig } from '@/components/list/types'
import { tasksConfig } from '@/components/list/configs/tasks'
import { projetosFolderConfig } from '@/components/list/configs/projetos-folder'
import { marketingConfig } from '@/components/list/configs/marketing-criacao'
import { oportunidadeConfig } from '@/components/list/configs/oportunidades'
import { processoConfig } from '@/components/list/configs/gestao-processos'
import { clientesConfig } from '@/components/list/configs/clientes'
import { eventosConfig } from '@/components/list/configs/eventos'
import { fornecedoresConfig } from '@/components/list/configs/fornecedores'

/**
 * Alterar QUALQUER campo personalizado (custom field) de QUALQUER List.
 *
 * Fonte única de verdade: as MESMAS configs que o motor de Lists usa na UI
 * (src/components/list/configs). Assim os campos, tipos e valores válidos que o
 * MCP conhece nunca divergem da tela — se um campo muda na config, muda aqui.
 * O registro abaixo só normaliza a FieldDef para o que o MCP precisa (tipo +
 * opções + relação) e une os campos das variantes de cada tabela.
 */

const SLUGS = ['projeto', 'marketing', 'oportunidade', 'processo', 'cliente', 'evento', 'fornecedor'] as const

type Campo = {
  key: string
  label: string
  type: FieldType
  /** valores válidos (select/multiselect). */
  options?: { value: string; label: string }[]
  /** tabela alvo (relation) para resolver nome→id. */
  relationTable?: string
}

function opcoesDe(f: FieldDef): { value: string; label: string }[] | undefined {
  if (f.options?.length) return f.options.map((o) => ({ value: String(o.value), label: o.label }))
  if (f.multiOptions?.length) return f.multiOptions.map((v) => ({ value: String(v), label: String(v) }))
  return undefined
}

/** Une os campos de uma ou mais configs (mesma tabela, variantes diferentes). */
function unir(...configs: ListConfig[]): Campo[] {
  const map = new Map<string, Campo>()
  for (const c of configs) {
    for (const f of c.fields) {
      if (f.editable === false) continue // deriva­dos / somente-leitura
      const novo: Campo = { key: f.key, label: f.label, type: f.type, options: opcoesDe(f), relationTable: f.relation?.table }
      const ex = map.get(f.key)
      if (!ex) map.set(f.key, novo)
      else if (!ex.options && novo.options) map.set(f.key, novo) // fica com a variante mais rica
    }
  }
  return [...map.values()]
}

type ListaReg = { slug: string; table: string; label: string; campos: Campo[] }

const REGISTRO: ListaReg[] = [
  { slug: 'projeto', table: 'task_projeto', label: 'Projetos (pré/intra/pós-evento)',
    campos: unir(projetosFolderConfig(), tasksConfig('onboarding'), tasksConfig('pre_evento')) },
  { slug: 'marketing', table: 'task_marketing', label: 'Marketing / Criação',
    campos: unir(marketingConfig('copy'), marketingConfig('design'), marketingConfig('publicacao'), marketingConfig('landing'), marketingConfig('formulario')) },
  { slug: 'oportunidade', table: 'task_oportunidade', label: 'Oportunidades (CRM)',
    campos: unir(oportunidadeConfig('trafego_pago'), oportunidadeConfig('prospeccao_ativa')) },
  { slug: 'processo', table: 'task_processo', label: 'Processos (POPs)', campos: unir(processoConfig('projetos')) },
  { slug: 'cliente', table: 'cliente', label: 'Clientes', campos: unir(clientesConfig) },
  { slug: 'evento', table: 'evento', label: 'Eventos', campos: unir(eventosConfig) },
  { slug: 'fornecedor', table: 'fornecedor', label: 'Fornecedores', campos: unir(fornecedoresConfig) },
]

const REG_BY_SLUG: Record<string, ListaReg> = Object.fromEntries(REGISTRO.map((r) => [r.slug, r]))

/** Acha o campo por chave exata, rótulo exato, ou rótulo parcial (case-insensitive). */
function acharCampo(reg: ListaReg, campo: string): Campo | null {
  const t = campo.trim().toLowerCase()
  return (
    reg.campos.find((c) => c.key.toLowerCase() === t || c.label.toLowerCase() === t) ??
    reg.campos.find((c) => c.label.toLowerCase().includes(t)) ??
    null
  )
}

function parseMoney(s: string): number | null {
  let t = s.replace(/[^\d.,-]/g, '')
  if (t.includes('.') && t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (t.includes(',')) t = t.replace(',', '.')
  const n = Number(t)
  return Number.isNaN(n) ? null : n
}

type Coercao = { ok: true; value: unknown } | { ok: false; msg: string; dica?: string }

/** Converte/valida o valor recebido conforme o tipo do campo. */
async function coagir(c: Campo, valorRaw: string): Promise<Coercao> {
  const valor = valorRaw.trim()
  if (valor === '') return { ok: true, value: null } // vazio = limpar o campo

  if (c.type === 'relation') {
    if (ehUuid(valor)) return { ok: true, value: valor }
    const tbl = c.relationTable
    let ref: { id: string } | null = null
    if (tbl === 'membros') ref = await resolveMembro(valor)
    else if (tbl === 'cliente') ref = await resolveCliente(valor)
    else if (tbl === 'evento') ref = await resolveEvento(valor)
    else if (tbl === 'fornecedor') ref = await resolveFornecedor(valor)
    else if (tbl) ref = (await resolveTasks(tbl, valor))[0] ?? null
    if (!ref) return { ok: false, msg: `Não encontrei "${valor}" para o campo ${c.label}.`, dica: 'Use o nome exato ou o id.' }
    return { ok: true, value: ref.id }
  }

  if (c.type === 'select') {
    if (!c.options) return { ok: true, value: valor } // select de texto livre (raro)
    const m = c.options.find((o) => o.value.toLowerCase() === valor.toLowerCase() || o.label.toLowerCase() === valor.toLowerCase())
    if (!m) return { ok: false, msg: `Valor "${valor}" inválido para ${c.label}.`, dica: `Valores válidos: ${c.options.map((o) => o.label).join(', ')}.` }
    return { ok: true, value: m.value }
  }

  if (c.type === 'multiselect') {
    const partes = valor.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    if (!c.options) return { ok: true, value: partes }
    const vals: string[] = []
    for (const p of partes) {
      const m = c.options.find((o) => o.value.toLowerCase() === p.toLowerCase() || o.label.toLowerCase() === p.toLowerCase())
      if (!m) return { ok: false, msg: `Valor "${p}" inválido para ${c.label}.`, dica: `Valores válidos: ${c.options.map((o) => o.label).join(', ')}.` }
      vals.push(m.value)
    }
    return { ok: true, value: vals }
  }

  if (c.type === 'date') return { ok: true, value: normalizarData(valor) }

  if (c.type === 'money') {
    const n = parseMoney(valor)
    if (n == null) return { ok: false, msg: `Valor monetário inválido: "${valor}".`, dica: 'Ex.: 15000 ou 15.000,50.' }
    return { ok: true, value: n }
  }

  if (c.type === 'richtext') return { ok: true, value: markdownToHtml(valor) }

  // text, email, tel
  return { ok: true, value: valor }
}

export function registrarCampos(server: McpServer) {
  // ── listar_campos ────────────────────────────────────────────────────────────
  server.registerTool(
    'listar_campos',
    {
      title: 'Listar campos personalizados',
      description:
        'Mostra os campos personalizados (custom fields) que dá para alterar em cada List, com o tipo e os valores válidos. ' +
        'Use antes de `atualizar_campo`. Sem `list`, lista as Lists disponíveis.',
      inputSchema: {
        list: z.enum(SLUGS).optional().describe('A List cujos campos você quer ver.'),
      },
      annotations: ANOT_READ,
    },
    tool(async ({ list }: { list?: string }) => {
      if (!list) {
        const linhas = REGISTRO.map((r) => `- \`${r.slug}\` — ${r.label} (${r.campos.length} campos)`)
        return texto(`Lists do sistema (use o slug em \`atualizar_campo\` / \`listar_campos\`):\n${linhas.join('\n')}`)
      }
      const reg = REG_BY_SLUG[list]
      const linhas = reg.campos.map((c) => {
        let extra = ''
        if (c.options) extra = ` — valores: ${c.options.map((o) => o.label).join(', ')}`
        else if (c.type === 'relation') extra = ` — informe nome ou id (${c.relationTable})`
        else if (c.type === 'date') extra = ' — data AAAA-MM-DD (hora opcional)'
        else if (c.type === 'money') extra = ' — número (ex.: 15000)'
        const multi = c.type === 'multiselect' ? ' · vários, separados por vírgula' : ''
        return `- **${c.label}** — chave \`${c.key}\`, tipo ${c.type}${multi}${extra}`
      })
      return texto(`Campos de **${reg.label}** (${reg.campos.length}):\n\n${linhas.join('\n')}`)
    })
  )

  // ── atualizar_campo ──────────────────────────────────────────────────────────
  server.registerTool(
    'atualizar_campo',
    {
      title: 'Alterar campo personalizado',
      description:
        'Altera UM campo personalizado (custom field) de um registro de QUALQUER List do sistema ' +
        '(projeto, marketing, oportunidade, processo, cliente, evento, fornecedor). Identifique o registro por id ou nome, ' +
        'e o campo por nome ou chave. O valor é validado conforme o tipo (enum aceita o rótulo ou a chave; relação resolve ' +
        'nome→id; multiselect separa por vírgula; data AAAA-MM-DD; valor vazio limpa o campo). Para vários campos, chame ' +
        'várias vezes. Descubra campos e valores válidos em `listar_campos`.',
      inputSchema: {
        list: z.enum(SLUGS).describe('A List do registro.'),
        task: z.string().min(1).describe('id (uuid) ou nome do registro a alterar.'),
        campo: z.string().min(1).describe('Nome ou chave do campo (ex.: "Prioridade" ou "prioridade").'),
        valor: z.string().describe('Novo valor. Multiselect: separe por vírgula. Vazio limpa o campo.'),
      },
      annotations: { ...ANOT_WRITE, idempotentHint: true },
    },
    tool(async ({ list, task, campo, valor }: { list: string; task: string; campo: string; valor: string }) => {
      const reg = REG_BY_SLUG[list]
      if (!reg) return erro(`List inválida: "${list}".`, `Use uma de: ${SLUGS.join(', ')}.`)

      const c = acharCampo(reg, campo)
      if (!c) {
        return erro(
          `O campo "${campo}" não existe em ${reg.label}.`,
          `Campos disponíveis: ${reg.campos.map((x) => x.label).join(', ')}. Veja detalhes em \`listar_campos\`.`
        )
      }

      const achados = await resolveTasks(reg.table, task)
      if (achados.length === 0) return erro(`Não encontrei "${task}" em ${reg.label}.`, 'Confira o nome ou o id.')
      if (achados.length > 1) {
        const linhas = achados.map((t) => `• ${t.nome} — id: ${t.id}`)
        return erro(
          `"${task}" casou com ${achados.length} registros em ${reg.label} — não alterei nada.`,
          `Repita informando o id exato:\n${linhas.join('\n')}`
        )
      }

      const coer = await coagir(c, valor)
      if (!coer.ok) return erro(coer.msg, coer.dica)

      const a = admin()
      const { error } = await a.from(reg.table).update({ [c.key]: coer.value }).eq('id', achados[0].id)
      if (error) return erro(`Não consegui alterar o campo: ${error.message}`, 'Confira se o valor é válido para esse campo.')

      const mostra = coer.value === null ? '(vazio)' : Array.isArray(coer.value) ? coer.value.join(', ') : String(coer.value)
      return texto(`✅ **${achados[0].nome}** — ${c.label} atualizado para: ${mostra}.`)
    })
  )
}

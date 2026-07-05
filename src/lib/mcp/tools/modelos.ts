import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, resolveEvento, resolveMembro, fmtData, ehUuid } from '../helpers'
import { ANOT_READ, ANOT_WRITE } from '../helpers'

/**
 * Modelos de task = tabela `playbook_modelo` (o "playbook das entregas",
 * editável em Configurações › Playbook). Cada linha é uma task-modelo.
 *
 * Hoje os modelos só são usados em bloco, automaticamente, quando o evento
 * entra em execução (trigger `disparar_playbook`). Estas tools deixam a equipe
 * e os agentes usarem os modelos SOB DEMANDA e de forma seletiva: uma task
 * específica ou uma lista inteira, para qualquer evento, a qualquer momento —
 * com o MESMO cálculo de prazo do trigger (data-âncora do evento + offset).
 */

const LISTAS_MODELO = ['onboarding', 'pre_evento', 'intra_evento', 'pos_evento'] as const

/** ancora do modelo → coluna de data no evento (igual ao trigger). */
const ANCORA_COL: Record<string, string> = {
  inicio_organizacao: 'data_inicio_organizacao',
  realizacao_inicio: 'data_realizacao_inicio',
  data_montagem: 'data_montagem',
  realizacao_fim: 'data_realizacao_fim',
}
const ANCORA_LABEL: Record<string, string> = {
  inicio_organizacao: 'Organização',
  realizacao_inicio: 'Realização',
  data_montagem: 'Montagem',
  realizacao_fim: 'Fim',
}
const LISTA_LABEL: Record<string, string> = {
  onboarding: 'Onboarding',
  pre_evento: 'Pré-evento',
  intra_evento: 'Intra-evento',
  pos_evento: 'Pós-evento',
}

function offsetLabel(d: number): string {
  if (d === 0) return 'no dia'
  return d > 0 ? `+${d}d` : `${d}d`
}

/** Soma `offset` dias à parte de data de um timestamp; devolve meia-noite ISO (só o dia). */
function somarDias(ts: string | null | undefined, offset: number): string | null {
  if (!ts) return null
  const [y, m, d] = ts.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + offset)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}T00:00:00`
}

type Modelo = {
  id: string
  titulo: string
  lista: string
  ancora: string
  offset_dias: number
  bloco: string | null
  setor_padrao: string | null
  prioridade_padrao: string
  descricao_padrao: string | null
  ordem: number
}

const COLS_MODELO = 'id, titulo, lista, ancora, offset_dias, bloco, setor_padrao, prioridade_padrao, descricao_padrao, ordem'

export function registrarModelos(server: McpServer) {
  // ── listar_modelos ─────────────────────────────────────────────────────────
  server.registerTool(
    'listar_modelos',
    {
      title: 'Listar modelos de task',
      description:
        'Mostra o catálogo de tasks-modelo do playbook (as entregas-padrão de onboarding/pré/intra/pós-evento). ' +
        'Use antes de `criar_task_de_modelo` para saber quais modelos existem. Filtre por `lista` e/ou `busca` (no título ou no bloco).',
      inputSchema: {
        lista: z.enum(LISTAS_MODELO).optional().describe('Só os modelos desta lista.'),
        busca: z.string().optional().describe('Filtra por texto no título ou no bloco.'),
      },
      annotations: ANOT_READ,
    },
    tool(async ({ lista, busca }: { lista?: string; busca?: string }) => {
      const a = admin()
      let q = a.from('playbook_modelo').select(COLS_MODELO).eq('ativo', true)
      if (lista) q = q.eq('lista', lista)
      if (busca?.trim()) {
        const t = busca.trim()
        q = q.or(`titulo.ilike.%${t}%,bloco.ilike.%${t}%`)
      }
      const { data, error } = await q.order('lista').order('ordem')
      if (error) return erro(`Não consegui listar os modelos: ${error.message}`)
      const rows = (data as Modelo[]) ?? []
      if (rows.length === 0) return texto('Nenhum modelo encontrado com esse filtro.')

      const porLista = new Map<string, Modelo[]>()
      for (const r of rows) {
        const arr = porLista.get(r.lista) ?? []
        arr.push(r)
        porLista.set(r.lista, arr)
      }

      let out = `📋 **Modelos de task** (${rows.length})\n`
      for (const [lst, itens] of porLista) {
        out += `\n**${LISTA_LABEL[lst] ?? lst}** (${itens.length})\n`
        let blocoAtual: string | null | undefined = undefined
        for (const r of itens) {
          if (r.bloco !== blocoAtual) {
            blocoAtual = r.bloco
            if (r.bloco) out += `  _${r.bloco}_\n`
          }
          const setor = r.setor_padrao ? ` · ${r.setor_padrao}` : ''
          out += `  - ${r.titulo} — ${ANCORA_LABEL[r.ancora] ?? r.ancora} ${offsetLabel(r.offset_dias)}${setor}\n`
        }
      }
      out += `\n💡 Para gerar: \`criar_task_de_modelo\` com \`evento\` + um \`modelo\` (nome/id) ou uma \`lista\` inteira.`
      return texto(out)
    })
  )

  // ── criar_task_de_modelo ────────────────────────────────────────────────────
  server.registerTool(
    'criar_task_de_modelo',
    {
      title: 'Criar task(s) a partir de modelo',
      description:
        'Cria task(s) de projeto para um evento a partir do playbook de modelos, SOB DEMANDA. ' +
        'Informe **um** `modelo` (nome ou id — cria 1 task) OU uma `lista` inteira (cria todas em lote, opcionalmente filtradas por `bloco`). ' +
        'O prazo de cada task é calculado igual ao playbook automático: data-âncora do evento + offset do modelo. ' +
        'Modelos cujo título já exista como task naquele evento são pulados (não duplica). Não é preciso o evento estar em execução.',
      inputSchema: {
        evento: z.string().describe('Nome ou id do evento que vai receber as tasks (obrigatório).'),
        modelo: z.string().optional().describe('Nome ou id de UM modelo específico (cria 1 task).'),
        lista: z.enum(LISTAS_MODELO).optional().describe('Cria em lote TODOS os modelos ativos desta lista.'),
        bloco: z.string().optional().describe('Com `lista`: só os modelos deste bloco (ex.: "B. Fornecedores e orçamento").'),
        responsavel: z.string().optional().describe('E-mail ou nome do responsável a atribuir em todas as tasks criadas.'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async (args: { evento: string; modelo?: string; lista?: string; bloco?: string; responsavel?: string }) => {
      if (!args.modelo && !args.lista) {
        return erro('Preciso saber o que gerar.', 'Informe um `modelo` (nome/id, cria 1) ou uma `lista` (cria o bloco inteiro).')
      }

      const ref = await resolveEvento(args.evento)
      if (!ref) return erro(`Não encontrei o evento "${args.evento}".`, 'Confira o nome ou use `listar_eventos`.')

      const a = admin()
      // Datas-âncora do evento (para calcular os prazos).
      const { data: ev } = await a
        .from('evento')
        .select('data_inicio_organizacao, data_realizacao_inicio, data_montagem, data_realizacao_fim')
        .eq('id', ref.id)
        .maybeSingle()
      const ancoras = (ev ?? {}) as Record<string, string | null>

      // Monta o conjunto de modelos a aplicar.
      let modelos: Modelo[] = []
      if (args.modelo) {
        const alvo = args.modelo.trim()
        let q = a.from('playbook_modelo').select(COLS_MODELO).eq('ativo', true)
        q = ehUuid(alvo) ? q.eq('id', alvo) : q.ilike('titulo', `%${alvo}%`)
        const { data, error } = await q.order('lista').order('ordem').limit(10)
        if (error) return erro(`Não consegui buscar o modelo: ${error.message}`)
        const encontrados = (data as Modelo[]) ?? []
        if (encontrados.length === 0) {
          return erro(`Nenhum modelo ativo casa com "${args.modelo}".`, 'Use `listar_modelos` para ver os títulos disponíveis.')
        }
        if (encontrados.length > 1) {
          const lista = encontrados.map((m) => `  - ${m.titulo} (${LISTA_LABEL[m.lista] ?? m.lista})`).join('\n')
          return erro(
            `"${args.modelo}" casa com ${encontrados.length} modelos. Seja mais específico:`,
            `Candidatos:\n${lista}`
          )
        }
        modelos = encontrados
      } else {
        let q = a.from('playbook_modelo').select(COLS_MODELO).eq('ativo', true).eq('lista', args.lista!)
        if (args.bloco?.trim()) q = q.ilike('bloco', `%${args.bloco.trim()}%`)
        const { data, error } = await q.order('ordem')
        if (error) return erro(`Não consegui buscar os modelos: ${error.message}`)
        modelos = (data as Modelo[]) ?? []
        if (modelos.length === 0) {
          return erro(
            `Nenhum modelo ativo em ${LISTA_LABEL[args.lista!] ?? args.lista}${args.bloco ? ` / bloco "${args.bloco}"` : ''}.`,
            'Confira em `listar_modelos` ou no Playbook (Configurações).'
          )
        }
      }

      // Responsável (opcional, aplicado a todas).
      let responsavelId: string | undefined
      if (args.responsavel) {
        const m = await resolveMembro(args.responsavel)
        if (!m) return erro(`Não encontrei o responsável "${args.responsavel}".`, 'Use o e-mail exato ou parte do nome.')
        responsavelId = m.id
      }

      // Dedupe: não recria um modelo cujo título já é task deste evento (mesmo tipo).
      const { data: existentesData } = await a
        .from('task_projeto')
        .select('nome, tipo')
        .eq('evento_id', ref.id)
      const existentes = new Set(((existentesData as { nome: string; tipo: string }[]) ?? []).map((t) => `${t.tipo}::${t.nome}`))

      const aInserir: Record<string, unknown>[] = []
      const criadas: { titulo: string; prazo: string | null }[] = []
      let pulados = 0
      for (const m of modelos) {
        if (existentes.has(`${m.lista}::${m.titulo}`)) {
          pulados++
          continue
        }
        const prazo = somarDias(ancoras[ANCORA_COL[m.ancora]], m.offset_dias)
        aInserir.push({
          nome: m.titulo,
          tipo: m.lista,
          evento_id: ref.id,
          data_fim: prazo,
          prioridade: m.prioridade_padrao,
          status: 'a_fazer',
          descricao: m.descricao_padrao,
          ...(responsavelId ? { responsavel_id: responsavelId } : {}),
        })
        criadas.push({ titulo: m.titulo, prazo })
      }

      if (aInserir.length === 0) {
        return texto(`ℹ️ Nada a criar em **${ref.nome}**: os ${pulados} modelo(s) já existem como task neste evento.`)
      }

      const { error: insErr } = await a.from('task_projeto').insert(aInserir)
      if (insErr) return erro(`Não consegui criar as tasks: ${insErr.message}`)

      const linhas = criadas
        .slice(0, 40)
        .map((c) => `  - ${c.titulo} — prazo ${fmtData(c.prazo)}`)
        .join('\n')
      const resto = criadas.length > 40 ? `\n  … e mais ${criadas.length - 40}.` : ''
      const respLinha = responsavelId ? ` Responsável: ${args.responsavel}.` : ''
      const puladosLinha = pulados > 0 ? `\n⏭️ ${pulados} já existiam (puladas).` : ''
      return texto(
        `🎯 Evento **${ref.nome}** — ${criadas.length} task(s) criada(s) a partir de modelo.${respLinha}\n${linhas}${resto}${puladosLinha}`
      )
    })
  )
}

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { admin, texto, erro, tool, normalizarData, resolveMembro, ANOT_READ, ANOT_WRITE } from '../helpers'
import type { ListConfig, TaskTemplate } from '@/components/list/types'
import { tasksConfig } from '@/components/list/configs/tasks'
import { projetosFolderConfig } from '@/components/list/configs/projetos-folder'
import { marketingConfig } from '@/components/list/configs/marketing-criacao'
import { oportunidadeConfig } from '@/components/list/configs/oportunidades'
import { processoConfig } from '@/components/list/configs/gestao-processos'
import { clientesConfig } from '@/components/list/configs/clientes'
import { eventosConfig } from '@/components/list/configs/eventos'
import { fornecedoresConfig } from '@/components/list/configs/fornecedores'

/**
 * Criar tasks a partir dos TEMPLATES da List — os modelos pré-setados que
 * aparecem no menu "/" ao criar uma task na tela (ex.: "Post" em Marketing ›
 * Processo de copy). Diferente do playbook de eventos (tools/modelos.ts): estes
 * são os `config.templates` de cada List, com `defaults` já prontos (inclui a
 * descrição em rich text/HTML). Fonte única: as MESMAS configs da UI — se um
 * template novo é criado na config, o MCP passa a enxergá-lo sem mudar aqui.
 */

// Todas as variantes de List que podem ter templates. Só as que realmente têm
// (`templates` não-vazio) entram no registro.
const CANDIDATOS: ListConfig[] = [
  marketingConfig('copy'), marketingConfig('design'), marketingConfig('publicacao'), marketingConfig('landing'), marketingConfig('formulario'),
  tasksConfig('onboarding'), tasksConfig('pre_evento'), tasksConfig('intra_evento'), tasksConfig('pos_evento'),
  projetosFolderConfig(),
  oportunidadeConfig('trafego_pago'), oportunidadeConfig('prospeccao_ativa'),
  processoConfig('projetos'),
  clientesConfig, eventosConfig, fornecedoresConfig,
]

type TplReg = {
  slug: string
  lista: string
  table: string
  tipo?: string | number
  titleField: string
  templates: TaskTemplate[]
}

function slugDe(c: ListConfig): string {
  const seg = c.basePath.split('/').filter(Boolean).pop()
  return seg ?? c.table
}

const REGISTRO: TplReg[] = CANDIDATOS.filter((c) => c.templates && c.templates.length > 0).map((c) => ({
  slug: slugDe(c),
  lista: c.plural,
  table: c.table,
  tipo: c.baseFilter?.value,
  titleField: c.titleField,
  templates: c.templates!,
}))

/** Acha a List (por slug, nome/plural ou parte dele) que tem templates. */
function acharLista(input: string): TplReg | null {
  const t = input.trim().toLowerCase()
  return (
    REGISTRO.find((r) => r.slug.toLowerCase() === t || r.lista.toLowerCase() === t) ??
    REGISTRO.find((r) => r.lista.toLowerCase().includes(t) || r.slug.toLowerCase().includes(t)) ??
    null
  )
}

type Achado = { reg: TplReg; tpl: TaskTemplate }

/** Acha o template pelo label, opcionalmente restrito a uma List. */
function acharTemplate(label: string, lista?: string): Achado[] {
  const alvo = label.trim().toLowerCase()
  const regs = lista ? [acharLista(lista)].filter(Boolean) as TplReg[] : REGISTRO
  const out: Achado[] = []
  for (const reg of regs) {
    for (const tpl of reg.templates) {
      if (tpl.label.toLowerCase() === alvo || tpl.label.toLowerCase().includes(alvo)) out.push({ reg, tpl })
    }
  }
  return out
}

export function registrarTemplates(server: McpServer) {
  // ── listar_templates ─────────────────────────────────────────────────────────
  server.registerTool(
    'listar_templates',
    {
      title: 'Listar templates de task',
      description:
        'Mostra os templates pré-setados de task de cada List — os modelos que aparecem no menu "/" ao criar uma task ' +
        '(ex.: "Post" em Marketing › Processo de copy). Use antes de `criar_task_de_template`. Filtre por `lista`.',
      inputSchema: {
        lista: z.string().optional().describe('Nome ou slug da List (ex.: "Processo de copy" ou "copy").'),
      },
      annotations: ANOT_READ,
    },
    tool(async ({ lista }: { lista?: string }) => {
      const regs = lista ? [acharLista(lista)].filter(Boolean) as TplReg[] : REGISTRO
      if (regs.length === 0) {
        return texto(
          lista
            ? `Nenhuma List "${lista}" com templates. Lists com templates: ${REGISTRO.map((r) => r.lista).join(', ') || '(nenhuma)'}.`
            : 'Nenhuma List tem templates configurados ainda.'
        )
      }
      let out = ''
      for (const reg of regs) {
        out += `**${reg.lista}** (\`${reg.slug}\`):\n`
        out += reg.templates.map((t) => `  - ${t.label}`).join('\n')
        out += '\n\n'
      }
      out += '💡 Para criar: `criar_task_de_template` com o `template` (e a `lista` se o nome se repetir).'
      return texto(out.trim())
    })
  )

  // ── criar_task_de_template ───────────────────────────────────────────────────
  server.registerTool(
    'criar_task_de_template',
    {
      title: 'Criar task a partir de template',
      description:
        'Cria uma task usando um template pré-setado da List (o modelo do menu "/", ex.: "Post" em Processo de copy). ' +
        'O template já traz os campos prontos (tipo de conteúdo, descrição em rich text, etc.); informe o `nome` para completar o título. ' +
        'Se o mesmo nome de template existir em mais de uma List, informe `lista`. Veja os templates em `listar_templates`.',
      inputSchema: {
        template: z.string().min(1).describe('Nome do template (ex.: "Post").'),
        nome: z.string().optional().describe('Título da task. Se o template tiver um prefixo (ex.: "Post | "), é combinado com ele.'),
        lista: z.string().optional().describe('Nome ou slug da List, se o template existir em mais de uma.'),
        responsavel: z.string().optional().describe('E-mail ou nome do responsável.'),
        prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
        data_fim: z.string().optional().describe('Prazo (AAAA-MM-DD).'),
      },
      annotations: ANOT_WRITE,
    },
    tool(async (args: {
      template: string; nome?: string; lista?: string; responsavel?: string; prioridade?: string; data_fim?: string
    }) => {
      if (REGISTRO.length === 0) {
        return erro('Não há templates configurados no sistema ainda.', 'Os templates são criados na config de cada List.')
      }
      const achados = acharTemplate(args.template, args.lista)
      if (achados.length === 0) {
        const disp = REGISTRO.flatMap((r) => r.templates.map((t) => `${t.label} (${r.lista})`)).join(', ')
        return erro(`Nenhum template "${args.template}"${args.lista ? ` em "${args.lista}"` : ''}.`, `Templates disponíveis: ${disp}. Veja em \`listar_templates\`.`)
      }
      if (achados.length > 1) {
        const linhas = achados.map((a) => `  - ${a.tpl.label} → List "${a.reg.lista}" (lista: ${a.reg.slug})`).join('\n')
        return erro(`"${args.template}" existe em ${achados.length} Lists. Informe qual em \`lista\`:`, linhas)
      }

      const { reg, tpl } = achados[0]
      const payload: Record<string, unknown> = { ...tpl.defaults }

      // Título: combina o prefixo do template (se houver) com o nome informado.
      const tplTitulo = typeof tpl.defaults[reg.titleField] === 'string' ? (tpl.defaults[reg.titleField] as string) : ''
      if (args.nome?.trim()) {
        const n = args.nome.trim()
        payload[reg.titleField] = /[|:\-–]\s*$/.test(tplTitulo) ? `${tplTitulo}${n}` : n
      } else if (!tplTitulo) {
        return erro('Preciso de um `nome` para a task.', 'Esse template não traz título; informe o `nome`.')
      }

      // A task herda o `tipo` da List (baseFilter) para cair na lista certa.
      if (reg.tipo != null) payload.tipo = reg.tipo

      if (args.prioridade) payload.prioridade = args.prioridade
      const df = normalizarData(args.data_fim); if (df) payload.data_fim = df
      if (args.responsavel) {
        const m = await resolveMembro(args.responsavel)
        if (!m) return erro(`Não encontrei o responsável "${args.responsavel}".`, 'Use o e-mail exato ou parte do nome.')
        payload.responsavel_id = m.id
      }

      const a = admin()
      const { data, error } = await a.from(reg.table).insert(payload).select('id, nome').single()
      if (error) return erro(`Não consegui criar a task pelo template: ${error.message}`)
      return texto(`✅ Task **${data.nome}** criada em ${reg.lista} (template "${tpl.label}").\nid: ${data.id}`)
    })
  )
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Membro } from './auth'
import { registrarLeitura } from './tools/leitura'
import { registrarAcoes } from './tools/acoes'
import { registrarClientes } from './tools/clientes'
import { registrarFornecedores } from './tools/fornecedores'
import { registrarCrmEquipe } from './tools/crm_equipe'
import { registrarMarketing } from './tools/marketing'
import { registrarEventos } from './tools/eventos'
import { registrarAnatomia } from './tools/anatomia'
import { registrarProcessos } from './tools/processos'
import { registrarGenerico } from './tools/generico'
import { registrarModelos } from './tools/modelos'
import { registrarCampos } from './tools/campos'
import { registrarTemplates } from './tools/templates'

/**
 * Registra TODAS as tools do MCP do Sistema Eventos.
 * `getMembro` devolve o membro autenticado (resolvido pelo token na rota).
 */
export function registrarTools(server: McpServer, getMembro: () => Membro) {
  // Onda 1 — núcleo
  registrarLeitura(server, getMembro)
  registrarAcoes(server, getMembro)
  // Onda 2 — poder extra
  registrarClientes(server)
  registrarFornecedores(server)
  registrarCrmEquipe(server)
  registrarMarketing(server)
  registrarEventos(server)
  registrarAnatomia(server)
  registrarProcessos(server)
  registrarGenerico(server)
  registrarModelos(server)
  registrarCampos(server)
  registrarTemplates(server)
}

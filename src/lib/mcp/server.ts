import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Membro } from './auth'
import { registrarLeitura } from './tools/leitura'
import { registrarAcoes } from './tools/acoes'

/**
 * Registra TODAS as tools do MCP do Sistema Eventos.
 * `getMembro` devolve o membro autenticado (resolvido pelo token na rota).
 */
export function registrarTools(server: McpServer, getMembro: () => Membro) {
  registrarLeitura(server, getMembro)
  registrarAcoes(server, getMembro)
}

import { createMcpHandler } from 'mcp-handler'
import { validarToken } from '@/lib/mcp/auth'
import { registrarTools } from '@/lib/mcp/tools'

// Precisa de Node (usa supabase-js + service role) — não pode ser edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function extrairBearer(req: Request): string | undefined {
  const h = req.headers.get('authorization') ?? ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m?.[1]?.trim()
}

async function handle(req: Request): Promise<Response> {
  // Autorização = token pessoal do membro (ver src/lib/mcp/auth.ts).
  const membro = await validarToken(extrairBearer(req))
  if (!membro) {
    return new Response(JSON.stringify({ error: 'Token MCP inválido ou inativo.' }), {
      status: 401,
      headers: { 'content-type': 'application/json', 'www-authenticate': 'Bearer' },
    })
  }

  // Handler stateless por request, com as tools enxergando o membro autenticado.
  const handler = createMcpHandler(
    (server) => registrarTools(server, () => membro),
    {},
    { basePath: '/api', disableSse: true }
  )
  return handler(req)
}

export { handle as GET, handle as POST }

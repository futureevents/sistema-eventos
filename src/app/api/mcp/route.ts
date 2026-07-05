import { createMcpHandler } from 'mcp-handler'
import { validarToken } from '@/lib/mcp/auth'
import { registrarTools } from '@/lib/mcp/server'

// Precisa de Node (usa supabase-js + service role) — não pode ser edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function extrairToken(req: Request): string | undefined {
  // 1) Authorization: Bearer <token> — Claude Code (CLI) e automações.
  const h = req.headers.get('authorization') ?? ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  if (m?.[1]) return m[1].trim()
  // 2) ?token=<token> na URL — Conectores do app do Claude (só aceitam URL).
  try {
    const q = new URL(req.url).searchParams.get('token')
    if (q) return q.trim()
  } catch {}
  return undefined
}

async function handle(req: Request): Promise<Response> {
  const membro = await validarToken(extrairToken(req))
  if (!membro) {
    return new Response(JSON.stringify({ error: 'Token do MCP inválido ou inativo.' }), {
      status: 401,
      headers: { 'content-type': 'application/json', 'www-authenticate': 'Bearer' },
    })
  }

  // Handler stateless por request; as tools enxergam o membro autenticado.
  const handler = createMcpHandler(
    (server) => registrarTools(server, () => membro),
    {},
    { basePath: '/api', disableSse: true }
  )
  return handler(req)
}

export { handle as GET, handle as POST }

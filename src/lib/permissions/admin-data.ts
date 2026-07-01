import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Papel, Nivel, EscopoTipo } from './types'

export type MembroLinha = {
  email: string
  nome: string
  papel: Papel
  ativo: boolean
}

export type AcessoLinha = {
  email: string
  tipo: EscopoTipo
  slug: string
  nivel: Nivel
}

export type AcessosData = {
  membros: MembroLinha[]
  /** Chaves `${tipo}:${slug}` dos escopos privados. */
  privados: string[]
  acessos: AcessoLinha[]
}

/** Carrega tudo que a tela de Acessos precisa. Só chame após autorizar. */
export async function getAcessosData(): Promise<AcessosData> {
  const admin = createAdminClient()

  const [membrosRes, perfisRes, privRes, acsRes] = await Promise.all([
    admin.from('membros').select('email, nome'),
    admin.from('membro_perfil').select('email, papel, ativo'),
    admin.from('escopo_privado').select('escopo_tipo, escopo_slug'),
    admin.from('acesso').select('membro_email, escopo_tipo, escopo_slug, nivel'),
  ])

  const perfilPor = new Map<string, { papel: Papel; ativo: boolean }>()
  for (const p of (perfisRes.data ?? []) as { email: string; papel: Papel; ativo: boolean }[]) {
    perfilPor.set(p.email, { papel: p.papel, ativo: p.ativo })
  }

  const membros: MembroLinha[] = ((membrosRes.data ?? []) as { email: string; nome: string }[])
    .map((m) => {
      const perfil = perfilPor.get(m.email)
      return {
        email: m.email,
        nome: m.nome || m.email,
        papel: perfil?.papel ?? 'membro',
        ativo: perfil?.ativo ?? true,
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const privados = ((privRes.data ?? []) as { escopo_tipo: string; escopo_slug: string }[])
    .map((r) => `${r.escopo_tipo}:${r.escopo_slug}`)

  const acessos: AcessoLinha[] = ((acsRes.data ?? []) as {
    membro_email: string; escopo_tipo: EscopoTipo; escopo_slug: string; nivel: Nivel
  }[]).map((r) => ({ email: r.membro_email, tipo: r.escopo_tipo, slug: r.escopo_slug, nivel: r.nivel }))

  return { membros, privados, acessos }
}

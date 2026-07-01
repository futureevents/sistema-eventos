import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NAV, type NavSpace } from '@/lib/nav'
import {
  type Papel, type Nivel, type Capacidades,
  capacidadesDe, isAdminLike, NIVEL_PADRAO_MEMBRO,
} from './types'
import {
  type CadeiaEscopo, cadeiaDaHref, cadeiaDoPath, escopoKey,
} from './scopes'

export type PermissaoAtual = {
  email: string | null
  papel: Papel | null
  ativo: boolean
  /** Proprietário ou Administrador — enxerga e faz tudo. */
  isAdmin: boolean
  /** Nível efetivo numa List (por href). `null` = sem acesso (esconder). */
  nivelDaLista: (href: string) => Nivel | null
  /** Capacidades concretas numa List. `null` = sem acesso. */
  capsDaLista: (href: string) => Capacidades | null
  /** Pode ver qualquer rota (resolve a List que contém o pathname). */
  podeVerPath: (pathname: string) => boolean
  capsDoPath: (pathname: string) => Capacidades | null
  /** NAV filtrado só com o que a pessoa pode ver. */
  navVisivel: () => NavSpace[]
}

type Bruto = {
  email: string | null
  papel: Papel | null
  ativo: boolean
  privados: Set<string>
  acessos: Map<string, Nivel>
}

async function carregar(): Promise<Bruto> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? null

  if (!email) {
    return { email: null, papel: null, ativo: false, privados: new Set(), acessos: new Map() }
  }

  const admin = createAdminClient()
  const [perfilRes, privRes, acsRes] = await Promise.all([
    admin.from('membro_perfil').select('papel, ativo').eq('email', email).maybeSingle(),
    admin.from('escopo_privado').select('escopo_tipo, escopo_slug'),
    admin.from('acesso').select('escopo_tipo, escopo_slug, nivel').eq('membro_email', email),
  ])

  const privados = new Set<string>()
  for (const r of (privRes.data ?? []) as { escopo_tipo: string; escopo_slug: string }[]) {
    privados.add(escopoKey(r.escopo_tipo as never, r.escopo_slug))
  }
  const acessos = new Map<string, Nivel>()
  for (const r of (acsRes.data ?? []) as { escopo_tipo: string; escopo_slug: string; nivel: Nivel }[]) {
    acessos.set(escopoKey(r.escopo_tipo as never, r.escopo_slug), r.nivel)
  }

  // Perfil ausente (não deveria ocorrer — há trigger + backfill): trata como
  // Membro ativo para não travar o acesso ao conteúdo público.
  const papel = (perfilRes.data?.papel as Papel | undefined) ?? 'membro'
  const ativo = perfilRes.data?.ativo ?? true

  return { email, papel, ativo, privados, acessos }
}

/** Acesso mais específico concedido na cadeia (list > folder > space). */
function acessoExplicito(b: Bruto, c: CadeiaEscopo): Nivel | null {
  return (
    b.acessos.get(escopoKey('list', c.list.slug)) ??
    b.acessos.get(escopoKey('folder', c.folder.slug)) ??
    b.acessos.get(escopoKey('space', c.space.slug)) ??
    null
  )
}

function ehPrivado(b: Bruto, c: CadeiaEscopo): boolean {
  return (
    b.privados.has(escopoKey('list', c.list.slug)) ||
    b.privados.has(escopoKey('folder', c.folder.slug)) ||
    b.privados.has(escopoKey('space', c.space.slug))
  )
}

function resolverNivel(b: Bruto, c: CadeiaEscopo | null): Nivel | null {
  if (!c) return null
  if (!b.ativo) return null
  if (isAdminLike(b.papel)) return 'total'

  const explicito = acessoExplicito(b, c)

  if (b.papel === 'convidado') {
    // Convidado só vê o que foi explicitamente compartilhado.
    return explicito
  }

  // Membro: privado esconde salvo concessão; público cai no nível padrão.
  if (ehPrivado(b, c) && !explicito) return null
  return explicito ?? NIVEL_PADRAO_MEMBRO
}

/** Resolve as permissões do usuário atual (memoizado por request). */
export const getMyPermissions = cache(async (): Promise<PermissaoAtual> => {
  const b = await carregar()

  const nivelDaLista = (href: string) => resolverNivel(b, cadeiaDaHref(href))
  const capsDaLista = (href: string): Capacidades | null => {
    const n = nivelDaLista(href)
    return n ? capacidadesDe(n) : null
  }
  const capsDoPath = (pathname: string): Capacidades | null => {
    const n = resolverNivel(b, cadeiaDoPath(pathname))
    return n ? capacidadesDe(n) : null
  }

  return {
    email: b.email,
    papel: b.papel,
    ativo: b.ativo,
    isAdmin: isAdminLike(b.papel),
    nivelDaLista,
    capsDaLista,
    podeVerPath: (pathname: string) => resolverNivel(b, cadeiaDoPath(pathname)) !== null,
    capsDoPath,
    navVisivel: () =>
      NAV
        .map((space) => ({
          ...space,
          folders: space.folders
            .map((folder) => ({
              ...folder,
              lists: folder.lists.filter((l) => nivelDaLista(l.href) !== null),
            }))
            .filter((folder) => folder.lists.length > 0),
        }))
        .filter((space) => space.folders.length > 0),
  }
})

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMyPermissions } from './resolve'
import type { Papel, Nivel, EscopoTipo } from './types'

// ── Autorização ──────────────────────────────────────────────────────────────

async function exigirAdmin() {
  const perm = await getMyPermissions()
  if (!perm.isAdmin || !perm.ativo) throw new Error('Sem permissão para gerenciar acessos.')
  return perm
}

async function contarProprietariosAtivos(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { count } = await admin
    .from('membro_perfil')
    .select('email', { count: 'exact', head: true })
    .eq('papel', 'proprietario')
    .eq('ativo', true)
  return count ?? 0
}

function revalidar() {
  revalidatePath('/configuracoes/acessos')
  // O NAV visível depende dos escopos — revalida o app inteiro.
  revalidatePath('/', 'layout')
}

// ── Papel do membro ──────────────────────────────────────────────────────────

export async function definirPapel(email: string, papel: Papel): Promise<void> {
  const caller = await exigirAdmin()
  const admin = createAdminClient()

  const { data: alvo } = await admin
    .from('membro_perfil').select('papel, ativo').eq('email', email).maybeSingle()

  // Mexer com Proprietário (promover a, ou alterar um) exige ser Proprietário.
  if ((papel === 'proprietario' || alvo?.papel === 'proprietario') && caller.papel !== 'proprietario') {
    throw new Error('Apenas um Proprietário pode gerenciar o papel de Proprietário.')
  }
  // Não deixar o sistema sem nenhum Proprietário.
  if (alvo?.papel === 'proprietario' && papel !== 'proprietario' && alvo.ativo) {
    if (await contarProprietariosAtivos(admin) <= 1) {
      throw new Error('Não é possível remover o último Proprietário.')
    }
  }

  const { error } = await admin
    .from('membro_perfil')
    .update({ papel, atualizado_em: new Date().toISOString() })
    .eq('email', email)
  if (error) throw new Error(error.message)
  revalidar()
}

export async function definirAtivo(email: string, ativo: boolean): Promise<void> {
  const caller = await exigirAdmin()
  const admin = createAdminClient()

  const { data: alvo } = await admin
    .from('membro_perfil').select('papel, ativo').eq('email', email).maybeSingle()

  if (alvo?.papel === 'proprietario') {
    if (caller.papel !== 'proprietario') {
      throw new Error('Apenas um Proprietário pode desativar um Proprietário.')
    }
    if (!ativo && await contarProprietariosAtivos(admin) <= 1) {
      throw new Error('Não é possível desativar o último Proprietário.')
    }
  }

  const { error } = await admin
    .from('membro_perfil')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('email', email)
  if (error) throw new Error(error.message)
  revalidar()
}

// ── Privacidade de escopo (Space/Folder/List) ────────────────────────────────

export async function definirPrivado(tipo: EscopoTipo, slug: string, privado: boolean): Promise<void> {
  await exigirAdmin()
  const admin = createAdminClient()

  if (privado) {
    const { error } = await admin
      .from('escopo_privado')
      .upsert({ escopo_tipo: tipo, escopo_slug: slug }, { onConflict: 'escopo_tipo,escopo_slug' })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await admin
      .from('escopo_privado').delete().eq('escopo_tipo', tipo).eq('escopo_slug', slug)
    if (error) throw new Error(error.message)
  }
  revalidar()
}

// ── Concessões de acesso (pessoa · escopo · nível) ───────────────────────────

export async function definirAcesso(email: string, tipo: EscopoTipo, slug: string, nivel: Nivel): Promise<void> {
  await exigirAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('acesso')
    .upsert(
      { membro_email: email, escopo_tipo: tipo, escopo_slug: slug, nivel },
      { onConflict: 'membro_email,escopo_tipo,escopo_slug' },
    )
  if (error) throw new Error(error.message)
  revalidar()
}

export async function removerAcesso(email: string, tipo: EscopoTipo, slug: string): Promise<void> {
  await exigirAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('acesso')
    .delete()
    .eq('membro_email', email).eq('escopo_tipo', tipo).eq('escopo_slug', slug)
  if (error) throw new Error(error.message)
  revalidar()
}

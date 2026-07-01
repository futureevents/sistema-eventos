// Tipos e regras puras de permissão. Sem I/O — pode ser usado no cliente e no
// servidor. Ver `.claude/acessos-permissoes.md` para o modelo completo.

export type Papel = 'proprietario' | 'administrador' | 'membro' | 'convidado'
export type Nivel = 'ver' | 'comentar' | 'editar' | 'total'
export type EscopoTipo = 'space' | 'folder' | 'list'

export const PAPEIS: Papel[] = ['proprietario', 'administrador', 'membro', 'convidado']
export const NIVEIS: Nivel[] = ['ver', 'comentar', 'editar', 'total']

/** Ordem crescente de poder — usada para comparar níveis. */
export const NIVEL_RANK: Record<Nivel, number> = { ver: 1, comentar: 2, editar: 3, total: 4 }

/** Nível padrão de um Membro num escopo público (sem concessão explícita). */
export const NIVEL_PADRAO_MEMBRO: Nivel = 'editar'

export const PAPEL_LABEL: Record<Papel, string> = {
  proprietario: 'Proprietário',
  administrador: 'Administrador',
  membro: 'Membro',
  convidado: 'Convidado',
}

export const NIVEL_LABEL: Record<Nivel, string> = {
  ver: 'Ver',
  comentar: 'Comentar',
  editar: 'Editar',
  total: 'Total',
}

/** Papéis que enxergam e fazem tudo, ignorando os escopos. */
export function isAdminLike(papel: Papel | null): boolean {
  return papel === 'proprietario' || papel === 'administrador'
}

/** Capacidades concretas derivadas de um nível de acesso a um escopo. */
export type Capacidades = {
  nivel: Nivel
  canView: boolean
  canComment: boolean
  canEdit: boolean
  /** Apagar task + mexer em estrutura/automação. */
  canDelete: boolean
}

export function capacidadesDe(nivel: Nivel): Capacidades {
  const rank = NIVEL_RANK[nivel]
  return {
    nivel,
    canView: rank >= NIVEL_RANK.ver,
    canComment: rank >= NIVEL_RANK.comentar,
    canEdit: rank >= NIVEL_RANK.editar,
    canDelete: rank >= NIVEL_RANK.total,
  }
}

/** Capacidades "tudo liberado" — para papéis admin-like. */
export const CAPS_TOTAL: Capacidades = capacidadesDe('total')

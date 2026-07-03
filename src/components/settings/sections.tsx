import type { ReactNode } from 'react'

export type SettingsGroup = 'Geral' | 'Automações' | 'Equipe' | 'Sistema'

export type SettingsSection = {
  slug: string
  href: string
  label: string
  /** Frase curta de uma linha — usada no card da visão geral e como subtítulo. */
  summary: string
  group: SettingsGroup
  icon: SettingsIconKey
  /** Match exato de rota (só a visão geral, cuja href é prefixo de todas as outras). */
  exact?: boolean
  /** Preview do que a seção vai conter — mostrado no placeholder enquanto não é construída. */
  planned: string[]
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    slug: 'visao-geral',
    href: '/configuracoes',
    label: 'Visão geral',
    summary: 'Ponto de partida das configurações do workspace.',
    group: 'Geral',
    icon: 'overview',
    exact: true,
    planned: [
      'Atalhos para todas as seções de configuração',
      'Resumo de membros ativos e papéis',
      'Estado das automações em execução',
    ],
  },
  {
    slug: 'playbook',
    href: '/configuracoes/playbook',
    label: 'Playbook das entregas',
    summary: 'Tasks-modelo de onboarding, pré, intra e pós-evento criadas automaticamente.',
    group: 'Automações',
    icon: 'bolt',
    planned: [],
  },
  {
    slug: 'acessos',
    href: '/configuracoes/acessos',
    label: 'Acessos & permissões',
    summary: 'Membros do workspace e o que cada papel pode fazer.',
    group: 'Equipe',
    icon: 'users',
    planned: [],
  },
  {
    slug: 'statuses',
    href: '/configuracoes/statuses',
    label: 'Statuses & cores',
    summary: 'Nomes e cores dos status de cada List.',
    group: 'Sistema',
    icon: 'tag',
    planned: [
      'Status disponíveis por List (Eventos, Clientes, Tasks…)',
      'Cor e rótulo de cada status',
      'Status que contam como concluído',
    ],
  },
  {
    slug: 'atividade',
    href: '/configuracoes/atividade',
    label: 'Log de atividade',
    summary: 'Histórico consolidado de tudo que acontece no sistema.',
    group: 'Sistema',
    icon: 'activity',
    planned: [
      'Timeline global de criações, edições e mudanças de status',
      'Filtro por membro, List e tipo de evento',
      'Origem da ação (manual ou automação)',
    ],
  },
  {
    slug: 'preferencias',
    href: '/configuracoes/preferencias',
    label: 'Preferências',
    summary: 'Ajustes pessoais de conta e notificações.',
    group: 'Geral',
    icon: 'sliders',
    planned: [
      'Tema e densidade da interface',
      'Notificações por menção e atribuição',
      'Idioma e formato de data',
    ],
  },
]

export const SETTINGS_GROUP_ORDER: SettingsGroup[] = ['Geral', 'Automações', 'Equipe', 'Sistema']

export function getSettingsSection(slug: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.slug === slug)
}

// ── Ícones (traço fino e sóbrio, conforme o design system) ──────────────────

export type SettingsIconKey =
  | 'overview'
  | 'bolt'
  | 'users'
  | 'tag'
  | 'activity'
  | 'sliders'
  | 'terminal'
  | 'gear'

export function SettingsIcon({ icon, size = 16 }: { icon: SettingsIconKey; size?: number }) {
  const paths: Record<SettingsIconKey, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    tag: (
      <>
        <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    terminal: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M6 9l3 3-3 3" />
        <line x1="12" y1="15" x2="16" y2="15" />
      </>
    ),
    sliders: (
      <>
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[icon]}
    </svg>
  )
}

export type NavList = {
  label: string
  slug: string
  href: string
}

export type NavFolder = {
  label: string
  slug: string
  href?: string   // se definido, clicar no nome do folder navega para essa URL
  lists: NavList[]
}

export type NavSpace = {
  label: string
  slug: string
  color: string
  folders: NavFolder[]
}

export const NAV: NavSpace[] = [
  {
    label: 'Comercial',
    slug: 'comercial',
    color: '#6E56CF',
    folders: [
      {
        label: 'Oportunidades',
        slug: 'oportunidades',
        lists: [
          { label: 'Geração de novas oportunidades', slug: 'geracao', href: '/comercial/oportunidades/geracao' },
          { label: 'Renovações & upgrades', slug: 'renovacoes', href: '/comercial/oportunidades/renovacoes' },
        ],
      },
      {
        label: 'Gestão de clientes',
        slug: 'gestao-de-clientes',
        lists: [
          { label: 'Clientes', slug: 'clientes', href: '/comercial/gestao-de-clientes/clientes' },
        ],
      },
    ],
  },
  {
    label: 'Entregas',
    slug: 'entregas',
    color: '#00C47A',
    folders: [
      {
        label: 'Projetos',
        slug: 'projetos',
        href: '/entregas/projetos',
        lists: [
          { label: 'Pré-evento', slug: 'pre-evento', href: '/entregas/projetos/pre-evento' },
          { label: 'Intra-evento', slug: 'intra-evento', href: '/entregas/projetos/intra-evento' },
          { label: 'Pós-evento', slug: 'pos-evento', href: '/entregas/projetos/pos-evento' },
          { label: 'Orçamento', slug: 'orcamento', href: '/entregas/projetos/orcamento' },
          { label: 'Financeiro', slug: 'financeiro', href: '/entregas/projetos/financeiro' },
        ],
      },
      {
        label: 'Base de dados',
        slug: 'base-de-dados',
        lists: [
          { label: 'Eventos', slug: 'eventos', href: '/entregas/base-de-dados/eventos' },
          { label: 'Fornecedores', slug: 'fornecedores', href: '/entregas/base-de-dados/fornecedores' },
        ],
      },
      {
        label: 'Patrocínios',
        slug: 'patrocinios',
        lists: [
          { label: 'Captação de patrocinadores', slug: 'captacao', href: '/entregas/patrocinios/captacao' },
          { label: 'Patrocinadores fechados', slug: 'fechados', href: '/entregas/patrocinios/fechados' },
        ],
      },
      {
        label: 'Entrada de clientes',
        slug: 'entrada-de-clientes',
        href: '/entregas/entrada-de-clientes',
        lists: [
          { label: 'Tarefas de onboarding', slug: 'onboarding', href: '/entregas/entrada-de-clientes/onboarding' },
          { label: 'Gestão de entregas', slug: 'gestao', href: '/entregas/entrada-de-clientes/gestao' },
        ],
      },
      {
        label: 'Científico',
        slug: 'cientifico',
        lists: [
          { label: 'Grade do evento', slug: 'grade', href: '/entregas/cientifico/grade' },
          { label: 'Compra de passagens', slug: 'passagens', href: '/entregas/cientifico/passagens' },
        ],
      },
    ],
  },
  {
    label: 'Gestão',
    slug: 'gestao',
    color: '#F59E0B',
    folders: [
      {
        label: 'Acessos',
        slug: 'acessos',
        lists: [
          { label: 'Emails e Redes sociais', slug: 'emails-redes', href: '/gestao/acessos/emails-redes' },
          { label: 'Ferramentas', slug: 'ferramentas', href: '/gestao/acessos/ferramentas' },
        ],
      },
      {
        label: 'Rotinas organizacionais',
        slug: 'rotinas',
        lists: [
          { label: 'Reuniões Gerais', slug: 'reunioes-gerais', href: '/gestao/rotinas/reunioes-gerais' },
          { label: 'Reuniões internas', slug: 'reunioes-internas', href: '/gestao/rotinas/reunioes-internas' },
          { label: 'Rotinas internas', slug: 'rotinas-internas', href: '/gestao/rotinas/rotinas-internas' },
        ],
      },
      {
        label: 'Jurídico',
        slug: 'juridico',
        lists: [
          { label: 'Gestão de contratos', slug: 'contratos', href: '/gestao/juridico/contratos' },
          { label: 'Tarefas jurídico', slug: 'tarefas', href: '/gestao/juridico/tarefas' },
        ],
      },
    ],
  },
  {
    label: 'Marketing',
    slug: 'marketing',
    color: '#EC4899',
    folders: [
      {
        label: 'Criação',
        slug: 'criacao',
        lists: [
          { label: 'Processo de copy', slug: 'copy', href: '/marketing/criacao/copy' },
          { label: 'Design e criação', slug: 'design', href: '/marketing/criacao/design' },
          { label: 'Publicações e disparos', slug: 'publicacoes', href: '/marketing/criacao/publicacoes' },
        ],
      },
      {
        label: 'Desenvolvimento web',
        slug: 'dev-web',
        lists: [
          { label: 'Landing pages e websites', slug: 'landing-pages', href: '/marketing/dev-web/landing-pages' },
          { label: 'Formulários', slug: 'formularios', href: '/marketing/dev-web/formularios' },
        ],
      },
    ],
  },
]

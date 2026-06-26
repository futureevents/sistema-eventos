import { type ListConfig, type FieldDef, type SelectOption, type TaskTemplate } from '../types'
import { SPACE_MARKETING } from '../spaces'

export type TipoListaMkt = 'copy' | 'design' | 'publicacao' | 'landing' | 'formulario'

// ── Status (superset). Cada List exibe só o subconjunto declarado abaixo. ─────
const ST: Record<string, SelectOption> = {
  para_fazer:   { value: 'para_fazer',   label: 'Para fazer',            dot: 'var(--fe-status-todo)',   bg: 'var(--fe-status-todo-tint)',   text: 'var(--fe-status-todo-text)' },
  para_gravar:  { value: 'para_gravar',  label: 'Para gravar',           dot: '#5B5BD6',                 bg: 'rgba(91,91,214,0.12)',         text: '#4A4AC0' },
  em_andamento: { value: 'em_andamento', label: 'Em andamento',          dot: 'var(--fe-status-prog)',   bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  em_aprovacao: { value: 'em_aprovacao', label: 'Em aprovação',          dot: 'var(--fe-status-review)', bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  em_alteracao: { value: 'em_alteracao', label: 'Em alteração & ajustes', dot: '#8E4EC6',                bg: 'rgba(142,78,198,0.12)',        text: '#7A3DAE' },
  descartado:   { value: 'descartado',   label: 'Descartado',            dot: 'var(--fe-prio-urgent)',   bg: 'rgba(220,61,67,0.12)',         text: '#C42A30' },
  finalizado:   { value: 'finalizado',   label: 'Finalizado',            dot: 'var(--fe-status-done)',   bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)', done: true },
}

const STATUS_POR_LISTA: Record<TipoListaMkt, string[]> = {
  copy:       ['para_fazer', 'em_andamento', 'em_aprovacao', 'em_alteracao', 'descartado', 'finalizado'],
  design:     ['para_fazer', 'para_gravar', 'em_andamento', 'em_aprovacao', 'em_alteracao', 'descartado', 'finalizado'],
  publicacao: ['para_fazer', 'em_andamento', 'descartado', 'finalizado'],
  landing:    ['para_fazer', 'em_andamento', 'em_aprovacao', 'em_alteracao', 'descartado', 'finalizado'],
  formulario: ['para_fazer', 'em_andamento', 'em_aprovacao', 'em_alteracao', 'descartado', 'finalizado'],
}

// ── Custom fields do Folder Criação (compartilhados pelas Lists) ──────────────
const TIPO_CONTEUDO: SelectOption[] = [
  { value: 'email',        label: 'E-mail',     dot: 'var(--fe-status-prog)',   bg: 'var(--fe-status-prog-tint)',   text: 'var(--fe-status-prog-text)' },
  { value: 'post',         label: 'Post',       dot: 'var(--fe-status-done)',   bg: 'var(--fe-status-done-tint)',   text: 'var(--fe-status-done-text)' },
  { value: 'anuncio',      label: 'Anúncio',    dot: 'var(--fe-status-review)', bg: 'var(--fe-status-review-tint)', text: 'var(--fe-status-review-text)' },
  { value: 'landing_page', label: 'Landing page', dot: '#5B5BD6',               bg: 'rgba(91,91,214,0.12)',         text: '#4A4AC0' },
  { value: 'formulario',   label: 'Formulário', dot: '#8E4EC6',                 bg: 'rgba(142,78,198,0.12)',        text: '#7A3DAE' },
  { value: 'mensagem',     label: 'Mensagem',   dot: '#E54666',                 bg: 'rgba(229,70,102,0.12)',        text: '#C42A30' },
]

const FORMATO_CONTEUDO: SelectOption[] = [
  { value: 'feed',       label: 'Feed',       dot: '#3E63DD', bg: 'rgba(62,99,221,0.12)',   text: '#3A4FC0' },
  { value: 'story',      label: 'Story',      dot: '#8E4EC6', bg: 'rgba(142,78,198,0.12)',  text: '#7A3DAE' },
  { value: 'reels',      label: 'Reels',      dot: '#E54666', bg: 'rgba(229,70,102,0.12)',  text: '#C42A30' },
  { value: 'estatico',   label: 'Estático',   dot: '#2E9E62', bg: 'rgba(46,158,98,0.14)',   text: '#207A49' },
  { value: 'video',      label: 'Vídeo',      dot: '#D5680B', bg: 'rgba(213,104,11,0.14)',  text: '#9A4E0A' },
  { value: 'carrossel',  label: 'Carrossel',  dot: '#0E8FC4', bg: 'rgba(14,143,196,0.12)',  text: '#0B6E97' },
  { value: 'audio',      label: 'Áudio',      dot: '#7C66DC', bg: 'rgba(124,102,220,0.13)', text: '#5B4BC0' },
  { value: 'texto',      label: 'Texto',      dot: '#8B8F98', bg: 'rgba(139,143,152,0.14)', text: '#5B606B' },
  { value: 'thumb',      label: 'Thumb',      dot: '#D6409F', bg: 'rgba(214,64,159,0.12)',  text: '#B03088' },
  { value: 'web',        label: 'Web',        dot: '#5B5BD6', bg: 'rgba(91,91,214,0.12)',   text: '#4A4AC0' },
  { value: 'formulario', label: 'Formulário', dot: '#D9730D', bg: 'rgba(217,115,13,0.13)',  text: '#9A4E0A' },
]

const CANAIS = ['Instagram', 'WhatsApp', 'Web', 'YouTube', 'Formy'] as const

const PRIORIDADE: SelectOption[] = [
  { value: 'urgente', label: 'Urgente', flag: 'var(--fe-prio-urgent)' },
  { value: 'alta',    label: 'Alta',    flag: 'var(--fe-prio-high)' },
  { value: 'media',   label: 'Média',   flag: 'var(--fe-prio-normal)' },
  { value: 'baixa',   label: 'Baixa',   flag: 'var(--fe-prio-low)' },
]

const TEMPLATES_COPY: TaskTemplate[] = [
  {
    label: 'Post',
    defaults: {
      nome: 'Post | ',
      tipo_conteudo: 'post',
      descricao: '<h2>Briefing</h2><ul><li><br></li><li><br></li><li><br></li></ul><h2>Copy</h2><h3>Headline</h3><p><br></p><h3>Corpo/Script</h3><p><br></p><h3>Legenda</h3><p><br></p>',
    },
  },
]

const META: Record<TipoListaMkt, { singular: string; plural: string; breadcrumb: string[]; basePath: string }> = {
  copy:       { singular: 'Conteúdo', plural: 'Processo de copy',        breadcrumb: ['Marketing', 'Criação', 'Processo de copy'],            basePath: '/marketing/criacao/copy' },
  design:     { singular: 'Conteúdo', plural: 'Design e criação',        breadcrumb: ['Marketing', 'Criação', 'Design e criação'],            basePath: '/marketing/criacao/design' },
  publicacao: { singular: 'Conteúdo', plural: 'Publicações e disparos',  breadcrumb: ['Marketing', 'Criação', 'Publicações e disparos'],      basePath: '/marketing/criacao/publicacoes' },
  landing:    { singular: 'Página',     plural: 'Landing pages e websites', breadcrumb: ['Marketing', 'Desenvolvimento web', 'Landing pages e websites'], basePath: '/marketing/dev-web/landing-pages' },
  formulario: { singular: 'Formulário', plural: 'Formulários',              breadcrumb: ['Marketing', 'Desenvolvimento web', 'Formulários'],              basePath: '/marketing/dev-web/formularios' },
}

export function marketingConfig(tipo: TipoListaMkt): ListConfig {
  const meta = META[tipo]
  const statusValues = STATUS_POR_LISTA[tipo]
  const statusOptions = statusValues.map((v) => ST[v])
  const isCriacao = tipo === 'copy' || tipo === 'design' || tipo === 'publicacao'

  // Pasta Criação: colunas fixas (Nome · Responsável · Formato · Publicação ·
  // Prioridade), nessa ordem. Os demais custom fields ficam fora das colunas
  // (continuam editáveis no painel da task). Desenvolvimento web mantém o layout
  // completo.
  const fields: FieldDef[] = isCriacao
    ? [
        { key: 'nome', label: 'Nome do conteúdo', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome do conteúdo' } },
        { key: 'responsavel_id', label: 'Responsável', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, column: { width: '140px', display: 'avatar' }, groupable: true, filterable: true },
        { key: 'formato_conteudo', label: 'Formato de conteúdo', type: 'multiselect', options: FORMATO_CONTEUDO, column: { width: '190px', display: 'tags' }, filterable: true },
        { key: 'data_publicacao', label: 'Data de publicação', type: 'date', column: { width: '150px', header: 'Data de publicação' }, groupable: true, filterable: true },
        { key: 'prioridade', label: 'Prioridade', type: 'select', options: PRIORIDADE, groupOrder: ['urgente', 'alta', 'media', 'baixa'], column: { width: '122px', display: 'flag' }, groupable: true, filterable: true },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions, groupOrder: statusValues, groupable: true, filterable: true },
        { key: 'tipo_conteudo', label: 'Tipo de conteúdo', type: 'select', options: TIPO_CONTEUDO, groupable: true, filterable: true },
        { key: 'canais_publicacao', label: 'Canais de publicação', type: 'multiselect', multiOptions: CANAIS, filterable: true },
        { key: 'designer_id', label: 'Designer / Editor de vídeos', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, groupable: true, filterable: true },
        { key: 'data_inicio', label: 'Início', type: 'date', groupable: true, filterable: true },
        { key: 'data_fim', label: 'Término', type: 'date', groupable: true, filterable: true },
        { key: 'descricao', label: 'Descrição', type: 'richtext' },
      ]
    : [
        { key: 'nome', label: 'Nome do conteúdo', type: 'text', required: true, column: { width: 'minmax(0,1fr)', primary: true, header: 'Nome do conteúdo' } },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions, groupOrder: statusValues, column: { width: '170px', display: 'pill' }, groupable: true, filterable: true },
        { key: 'tipo_conteudo', label: 'Tipo de conteúdo', type: 'select', options: TIPO_CONTEUDO, column: { width: '150px', display: 'pill' }, groupable: true, filterable: true },
        { key: 'formato_conteudo', label: 'Formato de conteúdo', type: 'multiselect', options: FORMATO_CONTEUDO, column: { width: '190px', display: 'tags' }, filterable: true },
        { key: 'canais_publicacao', label: 'Canais de publicação', type: 'multiselect', multiOptions: CANAIS, column: { width: '200px', display: 'tags' }, filterable: true },
        { key: 'designer_id', label: 'Designer / Editor de vídeos', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, column: { width: '120px', display: 'avatar' }, groupable: true, filterable: true },
        { key: 'data_publicacao', label: 'Data de publicação', type: 'date', column: { width: '150px', header: 'Publicação' }, groupable: true, filterable: true },
        { key: 'responsavel_id', label: 'Responsável', type: 'relation', relation: { table: 'membros', labelField: 'nome' }, column: { width: '120px', display: 'avatar' }, groupable: true, filterable: true },
        { key: 'prioridade', label: 'Prioridade', type: 'select', options: PRIORIDADE, groupOrder: ['urgente', 'alta', 'media', 'baixa'], column: { width: '122px', display: 'flag' }, groupable: true, filterable: true },
        { key: 'data_inicio', label: 'Início', type: 'date', groupable: true, filterable: true },
        { key: 'data_fim', label: 'Término', type: 'date', groupable: true, filterable: true },
        { key: 'descricao', label: 'Descrição', type: 'richtext' },
      ]

  return {
    table: 'task_marketing',
    space: SPACE_MARKETING,
    breadcrumb: meta.breadcrumb,
    basePath: meta.basePath,
    singular: meta.singular,
    plural: meta.plural,
    addLabel: 'Adicionar conteúdo',
    titleField: 'nome',
    titlePlaceholder: 'Nome do conteúdo',
    descriptionField: 'descricao',
    statusField: 'status',
    startDateField: 'data_inicio',
    endDateField: 'data_fim',
    assigneeField: 'responsavel_id',
    defaultGroupBy: 'status',
    baseFilter: { col: 'tipo', value: tipo },
    templates: tipo === 'copy' ? TEMPLATES_COPY : undefined,
    fields,
  }
}

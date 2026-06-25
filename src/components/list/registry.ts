import { type ListConfig } from './types'
import { eventosConfig } from './configs/eventos'
import { clientesConfig } from './configs/clientes'
import { fornecedoresConfig } from './configs/fornecedores'
import { tasksConfig } from './configs/tasks'

/**
 * Registro de Lists. As páginas (servidor) e os wrappers (cliente) resolvem a
 * config por chave — assim a config (que contém funções p/ campos derivados)
 * nunca cruza a fronteira servidor→cliente como prop.
 */
export const LIST_CONFIGS: Record<string, ListConfig> = {
  eventos: eventosConfig,
  clientes: clientesConfig,
  fornecedores: fornecedoresConfig,
  'tasks:onboarding': tasksConfig('onboarding'),
  'tasks:pre_evento': tasksConfig('pre_evento'),
  'tasks:intra_evento': tasksConfig('intra_evento'),
  'tasks:pos_evento': tasksConfig('pos_evento'),
}

export type ListKey = keyof typeof LIST_CONFIGS

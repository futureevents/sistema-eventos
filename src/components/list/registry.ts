import { type ListConfig } from './types'
import { eventosConfig } from './configs/eventos'
import { clientesConfig } from './configs/clientes'
import { fornecedoresConfig } from './configs/fornecedores'
import { tasksConfig } from './configs/tasks'
import { marketingConfig } from './configs/marketing-criacao'
import { processoConfig } from './configs/gestao-processos'
import { oportunidadeConfig } from './configs/oportunidades'
import { acessoConfig } from './configs/acessos'

/**
 * Registro de Lists. As páginas (servidor) e os wrappers (cliente) resolvem a
 * config por chave — assim a config (que contém funções p/ campos derivados)
 * nunca cruza a fronteira servidor→cliente como prop.
 */
export const LIST_CONFIGS: Record<string, ListConfig> = {
  eventos: eventosConfig,
  clientes: clientesConfig,
  'oport:trafego_pago': oportunidadeConfig('trafego_pago'),
  'oport:prospeccao_ativa': oportunidadeConfig('prospeccao_ativa'),
  fornecedores: fornecedoresConfig,
  'tasks:onboarding': tasksConfig('onboarding'),
  'tasks:pre_evento': tasksConfig('pre_evento'),
  'tasks:intra_evento': tasksConfig('intra_evento'),
  'tasks:pos_evento': tasksConfig('pos_evento'),
  'mkt:copy': marketingConfig('copy'),
  'mkt:design': marketingConfig('design'),
  'mkt:publicacao': marketingConfig('publicacao'),
  'mkt:landing': marketingConfig('landing'),
  'mkt:formulario': marketingConfig('formulario'),
  'proc:entrada_cliente': processoConfig('entrada_cliente'),
  'proc:projetos': processoConfig('projetos'),
  'proc:cientifico': processoConfig('cientifico'),
  'proc:marketing': processoConfig('marketing'),
  'proc:comercial': processoConfig('comercial'),
  'proc:juridico': processoConfig('juridico'),
  'proc:ia': processoConfig('ia'),
  'acesso:emails_redes': acessoConfig('emails_redes'),
  'acesso:ferramentas': acessoConfig('ferramentas'),
}

export type ListKey = keyof typeof LIST_CONFIGS

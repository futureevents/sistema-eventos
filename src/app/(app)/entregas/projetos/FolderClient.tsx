'use client'

import { FolderView } from '@/components/list/FolderView'
import { projetosFolderConfig } from '@/components/list/configs/projetos-folder'
import { SPACE_ENTREGAS } from '@/components/list/spaces'
import type { Row, OptionsMap } from '@/components/list/types'
import type { EmbedMap } from '@/components/list/load'

export function ProjetosFolderClient({
  rows,
  options,
  embeds,
}: {
  rows: Row[]
  options: OptionsMap
  embeds: EmbedMap
}) {
  return (
    <FolderView
      space={SPACE_ENTREGAS}
      breadcrumb={['Entregas', 'Projetos']}
      views={[
        {
          key: 'pre-intra-pos',
          label: 'Pré, Intra e Pós-evento',
          config: projetosFolderConfig(),
          rows,
          options,
          embeds,
        },
      ]}
    />
  )
}

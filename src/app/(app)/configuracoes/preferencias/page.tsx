import { SectionScaffold } from '@/components/settings/SectionScaffold'
import { getSettingsSection } from '@/components/settings/sections'
import { AlterarSenha } from '@/components/settings/AlterarSenha'

export default function PreferenciasPage() {
  const s = getSettingsSection('preferencias')!
  return (
    <SectionScaffold icon={s.icon} title={s.label} summary={s.summary} planned={s.planned}>
      <AlterarSenha />
    </SectionScaffold>
  )
}

import { SectionScaffold } from '@/components/settings/SectionScaffold'
import { getSettingsSection } from '@/components/settings/sections'

export default function AtividadePage() {
  const s = getSettingsSection('atividade')!
  return <SectionScaffold icon={s.icon} title={s.label} summary={s.summary} planned={s.planned} />
}

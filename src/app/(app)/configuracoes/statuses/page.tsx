import { SectionScaffold } from '@/components/settings/SectionScaffold'
import { getSettingsSection } from '@/components/settings/sections'

export default function StatusesPage() {
  const s = getSettingsSection('statuses')!
  return <SectionScaffold icon={s.icon} title={s.label} summary={s.summary} planned={s.planned} />
}

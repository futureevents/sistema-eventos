import { SectionScaffold } from '@/components/settings/SectionScaffold'
import { getSettingsSection } from '@/components/settings/sections'

export default function PlaybookPage() {
  const s = getSettingsSection('playbook')!
  return <SectionScaffold icon={s.icon} title={s.label} summary={s.summary} planned={s.planned} />
}

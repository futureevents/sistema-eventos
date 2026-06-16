import { DetalhePage } from '../../_shared/DetalhePage'
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DetalhePage id={id} />
}

import { NAV } from '@/lib/nav'
import { getMyPermissions } from '@/lib/permissions/resolve'
import { AcessoNegado } from '@/components/permissions/AcessoNegado'

function findList(slug: string[]) {
  const href = '/' + slug.join('/')
  for (const space of NAV) {
    for (const folder of space.folders) {
      for (const list of folder.lists) {
        if (list.href === href) {
          return { space: space.label, folder: folder.label, list: list.label }
        }
      }
    }
  }
  return null
}

export default async function PlaceholderPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const found = findList(slug)

  // Se é uma List conhecida mas privada para este usuário, bloqueia.
  if (found) {
    const perm = await getMyPermissions()
    if (!perm.podeVerPath('/' + slug.join('/'))) return <AcessoNegado />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 44,
          padding: '0 20px',
          borderBottom: '1px solid var(--fe-border-soft)',
          background: 'var(--fe-surface)',
          flexShrink: 0,
          gap: 6,
          fontSize: 13,
          color: 'var(--fe-text-muted)',
        }}
      >
        {found ? (
          <>
            <span>{found.space}</span>
            <span>/</span>
            <span>{found.folder}</span>
            <span>/</span>
            <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>{found.list}</span>
          </>
        ) : (
          <span style={{ fontWeight: 600, color: 'var(--fe-text)' }}>
            {slug[slug.length - 1]}
          </span>
        )}
      </div>

      {/* Em construção */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'var(--fe-surface)',
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: 'var(--fe-warm-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "var(--font-geist), sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>
            {found ? found.list : 'Página não encontrada'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Esta seção está sendo construída.
          </p>
        </div>
      </div>
    </div>
  )
}

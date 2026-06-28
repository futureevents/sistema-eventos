// Skeleton mostrado enquanto a página (List/Task) carrega no servidor.
// Dá feedback imediato na troca de List, com a sidebar (layout) permanecendo fixa.
export default function Loading() {
  return (
    <div className="fe-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }} aria-busy="true" aria-label="Carregando">
      {/* Cabeçalho da List */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 24px', borderBottom: '1px solid var(--fe-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="fe-skeleton" style={{ width: 20, height: 20, borderRadius: 6 }} />
          <span className="fe-skeleton" style={{ width: 160, height: 16 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="fe-skeleton" style={{ width: 76, height: 28, borderRadius: 8 }} />
          <span className="fe-skeleton" style={{ width: 76, height: 28, borderRadius: 8 }} />
          <span className="fe-skeleton" style={{ width: 96, height: 28, borderRadius: 8 }} />
        </div>
      </div>

      {/* Linhas */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 46, padding: '0 24px', borderBottom: '1px solid var(--fe-divider)' }}>
            <span className="fe-skeleton" style={{ width: 14, height: 14, borderRadius: 4, opacity: 0.7 }} />
            <span className="fe-skeleton" style={{ width: `${38 + ((i * 7) % 34)}%`, maxWidth: 420, height: 13 }} />
            <span style={{ flex: 1 }} />
            <span className="fe-skeleton" style={{ width: 80, height: 13, borderRadius: 99 }} />
            <span className="fe-skeleton" style={{ width: 22, height: 22, borderRadius: 99 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Telas de bloqueio (sem hooks → servem no servidor e no cliente).

function Moldura({ icon, titulo, descricao }: { icon: React.ReactNode; titulo: string; descricao: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--fe-surface)', padding: 24 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--fe-warm-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fe-text-muted)' }}>
          {icon}
        </div>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <p style={{ fontFamily: 'var(--font-geist), sans-serif', fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fe-text-strong)', margin: '0 0 6px' }}>{titulo}</p>
          <p style={{ fontSize: 13, color: 'var(--fe-text-muted)', margin: 0, lineHeight: 1.5 }}>{descricao}</p>
        </div>
      </div>
    </div>
  )
}

const CADEADO = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export function AcessoNegado({ descricao }: { descricao?: string } = {}) {
  return (
    <Moldura
      icon={CADEADO}
      titulo="Sem acesso a esta área"
      descricao={descricao ?? 'Você não tem permissão para ver este item. Fale com um administrador se precisar de acesso.'}
    />
  )
}

export function SomenteLeituraBloqueado() {
  return (
    <Moldura
      icon={CADEADO}
      titulo="Sem permissão para criar aqui"
      descricao="Seu nível de acesso nesta List permite apenas visualizar. Fale com um administrador para poder criar ou editar."
    />
  )
}

export function ContaDesativada() {
  return (
    <Moldura
      icon={CADEADO}
      titulo="Conta desativada"
      descricao="Seu acesso ao sistema está desativado no momento. Fale com um administrador da Future Events."
    />
  )
}

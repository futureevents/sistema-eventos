'use client'

import { useState } from 'react'

const card: React.CSSProperties = {
  border: '1px solid var(--fe-border)',
  borderRadius: 'var(--fe-radius-lg)',
  background: 'var(--fe-surface)',
  padding: '18px 20px',
}
const stepTitle: React.CSSProperties = {
  fontSize: 'var(--fe-text-base)',
  fontWeight: 600,
  color: 'var(--fe-text-strong)',
  margin: '0 0 8px',
}
const muted: React.CSSProperties = {
  fontSize: 'var(--fe-text-sm)',
  color: 'var(--fe-text-muted)',
  lineHeight: 1.5,
  margin: 0,
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        borderRadius: 'var(--fe-radius-md)',
        border: '1px solid var(--fe-border)',
        background: copied ? 'var(--fe-accent-dim)' : 'var(--fe-surface)',
        color: copied ? 'var(--fe-accent)' : 'var(--fe-text)',
        fontSize: 'var(--fe-text-sm)',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copiado' : label}
    </button>
  )
}

export function McpConnect({
  url,
  token,
  email,
}: {
  url: string
  token: string | null
  email: string | null
}) {
  if (!token) {
    return (
      <p style={{ ...muted, marginTop: 20 }}>
        Não encontramos um token para a sua conta{email ? ` (${email})` : ''}. Recarregue a
        página; se continuar, fale com o administrador.
      </p>
    )
  }

  const command = `claude mcp add --transport http sistema-eventos ${url} --header "Authorization: Bearer ${token}"`
  const connectorUrl = `${url}?token=${token}`

  const codeBox: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    fontFamily: 'var(--font-geist-mono, monospace)',
    fontSize: 12.5,
    lineHeight: 1.6,
    color: 'var(--fe-text)',
    background: 'var(--fe-warm-white)',
    border: '1px solid var(--fe-border-soft)',
    borderRadius: 'var(--fe-radius-md)',
    padding: '12px 14px',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
  }

  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ ...muted, marginBottom: 4 }}>
        Conecte do jeito que preferir. Os dois usam o <strong>seu token pessoal</strong> — não
        compartilhe com ninguém.
      </p>

      {/* Jeito 1 — App do Claude (desktop/web) */}
      <div style={card}>
        <h2 style={stepTitle}>Jeito 1 — App do Claude (desktop ou web)</h2>
        <p style={{ ...muted, marginBottom: 10 }}>
          Em <strong>Configurações → Conectores → + (Adicionar) → Personalizado</strong>, dê um
          nome (ex.: <em>Sistema de Eventos</em>) e cole esta URL no campo de endereço do servidor:
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <code style={codeBox}>{connectorUrl}</code>
          <CopyButton text={connectorUrl} label="Copiar URL" />
        </div>
      </div>

      {/* Jeito 2 — Claude Code (terminal) */}
      <div style={card}>
        <h2 style={stepTitle}>Jeito 2 — Claude Code (terminal)</h2>
        <p style={{ ...muted, marginBottom: 10 }}>
          Precisa ter o Claude Code instalado (
          <a
            href="https://docs.claude.com/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--fe-accent)', textDecoration: 'underline' }}
          >
            docs.claude.com/claude-code
          </a>
          ). Cole este comando no terminal:
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <code style={codeBox}>{command}</code>
          <CopyButton text={command} label="Copiar comando" />
        </div>
      </div>

      <div style={card}>
        <h2 style={stepTitle}>Pronto — é só perguntar</h2>
        <p style={muted}>
          Pergunte, por exemplo: <em>&ldquo;quais as principais urgências desta semana?&rdquo;</em>{' '}
          ou <em>&ldquo;cadastre o cliente X e crie uma task de pré-evento&rdquo;</em>.
        </p>
      </div>
    </div>
  )
}

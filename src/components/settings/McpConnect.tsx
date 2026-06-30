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

  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <h2 style={stepTitle}>1. Instale o Claude Code (uma vez)</h2>
        <p style={muted}>
          Se ainda não tem, siga{' '}
          <a
            href="https://docs.claude.com/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--fe-accent)', textDecoration: 'underline' }}
          >
            docs.claude.com/claude-code
          </a>
          . No terminal, confirme com <code>claude --version</code>.
        </p>
      </div>

      <div style={card}>
        <h2 style={stepTitle}>2. Cole este comando no seu terminal</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          <code
            style={{
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
            }}
          >
            {command}
          </code>
          <CopyButton text={command} label="Copiar comando" />
        </div>
        <p style={muted}>
          ⚠️ Este comando é <strong>só seu</strong> — contém seu token pessoal. Não compartilhe
          com ninguém. Se vazar, fale com o administrador para gerar outro.
        </p>
      </div>

      <div style={card}>
        <h2 style={stepTitle}>3. Pronto — é só perguntar</h2>
        <p style={muted}>
          Abra o Claude Code (digite <code>claude</code>) e pergunte, por exemplo:{' '}
          <em>&ldquo;quais as principais urgências desta semana?&rdquo;</em> ou{' '}
          <em>&ldquo;cadastre o cliente X e crie uma task de pré-evento&rdquo;</em>.
        </p>
      </div>
    </div>
  )
}

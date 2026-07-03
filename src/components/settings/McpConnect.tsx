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
        <h2 style={stepTitle}>Pronto — o que você pode pedir</h2>
        <p style={{ ...muted, marginBottom: 12 }}>
          O assistente enxerga e age no sistema por você. Fale naturalmente — ele encontra a task,
          o evento ou o cliente pelo nome. Alguns exemplos:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            '“Me dá o resumo do dia” · “Quais as urgências da semana?”',
            '“Liste os eventos em execução” · “Detalhe do evento Summit Focus”',
            '“Cadastre o cliente Acme” · “Liste meus clientes e fornecedores”',
            '“Crie uma task de pré-evento para o Summit, prazo sexta, responsável Rafaela”',
            '“Cole este POP na descrição da task” — com títulos e tabelas, vira texto formatado',
            '“Adicione um checklist de montagem na task” · “Anexe este arquivo”',
            '“Liste as oportunidades de tráfego pago” · “Coloque o evento X em execução”',
            '“Crie o processo de Entrada de cliente com este POP” · “Liste os processos ativos”',
            '“Edite a descrição desta task” · “Apague o processo X” (ele confirma antes)',
          ].map((ex, i) => (
            <li key={i} style={{ ...muted, fontSize: 'var(--fe-text-sm)' }}>{ex}</li>
          ))}
        </ul>
        <p style={{ ...muted, marginTop: 12, fontSize: 'var(--fe-text-sm)' }}>
          São <strong>33 ações</strong> hoje (consultar urgências e eventos, cadastrar e atualizar
          clientes e fornecedores, criar/editar/mover tasks e processos, comentar, anexar, checklists
          e mais). As ações que apagam algo são sempre confirmadas antes — nada some sem você aprovar.
        </p>
      </div>
    </div>
  )
}

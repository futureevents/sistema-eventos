'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SectionScaffold } from './SectionScaffold'
import {
  definirPapel, definirAtivo, definirPrivado, definirAcesso, removerAcesso,
} from '@/lib/permissions/actions'
import {
  PAPEIS, NIVEIS, PAPEL_LABEL, NIVEL_LABEL,
  type Papel, type Nivel, type EscopoTipo,
} from '@/lib/permissions/types'
import type { AcessosData } from '@/lib/permissions/admin-data'
import type { EscopoArvore } from '@/lib/permissions/scopes'

type ScopeOpt = { tipo: EscopoTipo; slug: string; label: string; depth: 0 | 1 | 2 }

export function AcessosManager({ data, arvore, callerPapel, callerEmail }: {
  data: AcessosData
  arvore: EscopoArvore[]
  callerPapel: Papel
  callerEmail: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function run(fn: () => Promise<void>) {
    start(async () => {
      try { await fn(); router.refresh() }
      catch (e) { alert(e instanceof Error ? e.message : 'Erro ao salvar.') }
    })
  }

  const privados = useMemo(() => new Set(data.privados), [data.privados])

  // Opções de escopo achatadas (para o seletor de acesso) + lookup de label.
  const scopeOpts = useMemo<ScopeOpt[]>(() => {
    const out: ScopeOpt[] = []
    for (const s of arvore) {
      out.push({ tipo: 'space', slug: s.space.slug, label: s.label, depth: 0 })
      for (const f of s.folders) {
        out.push({ tipo: 'folder', slug: f.folder.slug, label: `${s.label} › ${f.label}`, depth: 1 })
        for (const l of f.lists) {
          out.push({ tipo: 'list', slug: l.list.slug, label: `${s.label} › ${f.label} › ${l.label}`, depth: 2 })
        }
      }
    }
    return out
  }, [arvore])

  const labelDoEscopo = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of scopeOpts) m.set(`${o.tipo}:${o.slug}`, o.label)
    return m
  }, [scopeOpts])

  const podeMexerProprietario = callerPapel === 'proprietario'

  return (
    <SectionScaffold
      icon="users"
      title="Acessos & permissões"
      summary="Quem entra em cada parte do sistema e o que cada um pode fazer."
    >
      {pending && <div style={hintStyle}>Salvando…</div>}

      {/* 1. Membros */}
      <Bloco titulo="Membros" descricao="Papel de cada pessoa e se o acesso está ativo.">
        <div style={cardStyle}>
          {data.membros.map((m, i) => {
            const ehProprietario = m.papel === 'proprietario'
            const travado = ehProprietario && !podeMexerProprietario
            return (
              <div key={m.email} style={{ ...linhaStyle, borderTop: i === 0 ? 'none' : '1px solid var(--fe-divider)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
                  <span style={avatarStyle}>{iniciais(m.nome)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.nome}{m.email === callerEmail && <span style={{ color: 'var(--fe-text-faint)', fontWeight: 400 }}> (você)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                  </div>
                </div>
                <select
                  value={m.papel}
                  disabled={travado || pending}
                  onChange={(e) => run(() => definirPapel(m.email, e.target.value as Papel))}
                  style={selectStyle}
                >
                  {PAPEIS.filter((p) => p !== 'proprietario' || podeMexerProprietario || ehProprietario).map((p) => (
                    <option key={p} value={p}>{PAPEL_LABEL[p]}</option>
                  ))}
                </select>
                <button
                  onClick={() => run(() => definirAtivo(m.email, !m.ativo))}
                  disabled={travado || pending}
                  title={m.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                  style={{ ...pillBtn, background: m.ativo ? 'var(--fe-accent-dim)' : 'var(--fe-track)', color: m.ativo ? 'var(--fe-accent-dark)' : 'var(--fe-text-muted)', cursor: travado ? 'default' : 'pointer', opacity: travado ? 0.6 : 1 }}
                >
                  {m.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            )
          })}
        </div>
      </Bloco>

      {/* 2. Privacidade dos espaços */}
      <Bloco titulo="Privacidade dos espaços" descricao="Um item privado some para quem não foi liberado. O resto é público para todos os Membros.">
        <div style={cardStyle}>
          {scopeOpts.map((o, i) => {
            const key = `${o.tipo}:${o.slug}`
            const priv = privados.has(key)
            return (
              <div key={key} style={{ ...linhaStyle, paddingLeft: 16 + o.depth * 18, borderTop: i === 0 ? 'none' : '1px solid var(--fe-divider)' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: o.depth === 2 ? 'var(--fe-text)' : 'var(--fe-text-strong)', fontWeight: o.depth === 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.label.split(' › ').pop()}
                  <span style={{ fontSize: 11, color: 'var(--fe-text-faint)', marginLeft: 8, textTransform: 'capitalize' }}>{o.tipo === 'space' ? 'Espaço' : o.tipo === 'folder' ? 'Pasta' : 'List'}</span>
                </span>
                <button
                  onClick={() => run(() => definirPrivado(o.tipo, o.slug, !priv))}
                  disabled={pending}
                  style={{ ...pillBtn, background: priv ? '#F4E7B8' : 'var(--fe-track)', color: priv ? '#8A6D1F' : 'var(--fe-text-muted)' }}
                >
                  {priv ? '🔒 Privado' : 'Público'}
                </button>
              </div>
            )
          })}
        </div>
      </Bloco>

      {/* 3. Acessos específicos */}
      <Bloco titulo="Acessos específicos" descricao="Libere um item privado para alguém, ou ajuste o nível de uma pessoa num item.">
        <NovoAcesso membros={data.membros} scopeOpts={scopeOpts} pending={pending} onAdd={(email, tipo, slug, nivel) => run(() => definirAcesso(email, tipo, slug, nivel))} />
        <div style={{ ...cardStyle, marginTop: 12 }}>
          {data.acessos.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--fe-text-faint)' }}>Nenhum acesso específico ainda.</div>
          ) : data.acessos.map((a, i) => {
            const membro = data.membros.find((m) => m.email === a.email)
            return (
              <div key={`${a.email}:${a.tipo}:${a.slug}`} style={{ ...linhaStyle, borderTop: i === 0 ? 'none' : '1px solid var(--fe-divider)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--fe-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{membro?.nome ?? a.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--fe-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labelDoEscopo.get(`${a.tipo}:${a.slug}`) ?? a.slug}</div>
                </div>
                <span style={{ ...pillBtn, background: 'var(--fe-accent-dim)', color: 'var(--fe-accent-dark)', cursor: 'default' }}>{NIVEL_LABEL[a.nivel]}</span>
                <button onClick={() => run(() => removerAcesso(a.email, a.tipo, a.slug))} disabled={pending} title="Remover acesso" style={{ ...pillBtn, background: 'transparent', color: 'var(--fe-prio-urgent)', border: '1px solid var(--fe-border)' }}>Remover</button>
              </div>
            )
          })}
        </div>
      </Bloco>
    </SectionScaffold>
  )
}

function NovoAcesso({ membros, scopeOpts, pending, onAdd }: {
  membros: AcessosData['membros']
  scopeOpts: ScopeOpt[]
  pending: boolean
  onAdd: (email: string, tipo: EscopoTipo, slug: string, nivel: Nivel) => void
}) {
  const [email, setEmail] = useState('')
  const [scopeKey, setScopeKey] = useState('')
  const [nivel, setNivel] = useState<Nivel>('editar')

  function adicionar() {
    if (!email || !scopeKey) return
    const [tipo, ...rest] = scopeKey.split(':')
    onAdd(email, tipo as EscopoTipo, rest.join(':'), nivel)
    setEmail(''); setScopeKey('')
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <select value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...selectStyle, flex: '1 1 160px' }}>
        <option value="">Pessoa…</option>
        {membros.map((m) => <option key={m.email} value={m.email}>{m.nome}</option>)}
      </select>
      <select value={scopeKey} onChange={(e) => setScopeKey(e.target.value)} style={{ ...selectStyle, flex: '2 1 220px' }}>
        <option value="">Espaço / Pasta / List…</option>
        {scopeOpts.map((o) => <option key={`${o.tipo}:${o.slug}`} value={`${o.tipo}:${o.slug}`}>{o.label}</option>)}
      </select>
      <select value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)} style={{ ...selectStyle, flex: '0 1 130px' }}>
        {NIVEIS.map((n) => <option key={n} value={n}>{NIVEL_LABEL[n]}</option>)}
      </select>
      <button onClick={adicionar} disabled={pending || !email || !scopeKey} style={{ height: 34, padding: '0 16px', borderRadius: 'var(--fe-radius-md)', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 13, fontWeight: 600, border: 'none', cursor: (!email || !scopeKey) ? 'default' : 'pointer', opacity: (!email || !scopeKey) ? 0.5 : 1 }}>
        Liberar
      </button>
    </div>
  )
}

function Bloco({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 30 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fe-text-strong)', marginBottom: 3 }}>{titulo}</div>
      <p style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>{descricao}</p>
      {children}
    </section>
  )
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?'
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)',
  overflow: 'hidden', background: 'var(--fe-surface)',
}
const linhaStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
}
const avatarStyle: React.CSSProperties = {
  width: 30, height: 30, flexShrink: 0, borderRadius: '50%',
  background: 'var(--fe-accent-dim)', color: 'var(--fe-accent)',
  fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const selectStyle: React.CSSProperties = {
  height: 34, padding: '0 8px', borderRadius: 'var(--fe-radius-md)',
  border: '1px solid var(--fe-border)', background: 'var(--fe-surface)',
  fontSize: 13, color: 'var(--fe-text)', outline: 'none', cursor: 'pointer',
}
const pillBtn: React.CSSProperties = {
  height: 30, padding: '0 12px', borderRadius: 'var(--fe-radius-pill)',
  border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', flexShrink: 0,
}
const hintStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--fe-accent-dark)', marginTop: 6,
}

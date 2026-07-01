'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AlterarSenha() {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [estado, setEstado] = useState<'idle' | 'salvando' | 'ok'>('idle')
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setErro(null)
    if (senha.length < 6) { setErro('A senha precisa de ao menos 6 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não são iguais.'); return }
    setEstado('salvando')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) { setEstado('idle'); setErro(error.message); return }
    setEstado('ok'); setSenha(''); setConfirma('')
    setTimeout(() => setEstado('idle'), 3000)
  }

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fe-text-strong)', marginBottom: 3 }}>Senha</div>
      <p style={{ fontSize: 12.5, color: 'var(--fe-text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Troque a senha da sua conta. Recomendado no primeiro acesso.
      </p>
      <div style={{ border: '1px solid var(--fe-border)', borderRadius: 'var(--fe-radius-lg)', background: 'var(--fe-surface)', padding: 16, maxWidth: 420 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle}>
            Nova senha
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" placeholder="Ao menos 6 caracteres" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Confirmar nova senha
            <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" placeholder="Repita a senha" style={inputStyle} />
          </label>
          {erro && <div style={{ fontSize: 12.5, color: 'var(--fe-prio-urgent)' }}>{erro}</div>}
          {estado === 'ok' && <div style={{ fontSize: 12.5, color: 'var(--fe-accent-dark)' }}>Senha alterada com sucesso.</div>}
          <div>
            <button onClick={salvar} disabled={estado === 'salvando' || !senha || !confirma}
              style={{ height: 38, padding: '0 18px', borderRadius: 'var(--fe-radius-md)', border: 'none', background: 'var(--fe-accent)', color: 'var(--fe-accent-fg)', fontSize: 13, fontWeight: 600, cursor: (estado === 'salvando' || !senha || !confirma) ? 'default' : 'pointer', opacity: (estado === 'salvando' || !senha || !confirma) ? 0.5 : 1 }}>
              {estado === 'salvando' ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: 12.5, fontWeight: 500, color: 'var(--fe-text-muted)',
}
const inputStyle: React.CSSProperties = {
  height: 38, padding: '0 11px', borderRadius: 'var(--fe-radius-md)',
  border: '1px solid var(--fe-border)', background: 'var(--fe-surface)',
  fontSize: 13.5, color: 'var(--fe-text)', outline: 'none',
}

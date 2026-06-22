'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }
    router.push('/eventos')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--fe-warm-white)' }}
    >
      <div className="w-full max-w-[400px] px-4">
        {/* Logo / marca */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5"
            style={{ background: 'var(--fe-black)' }}
          >
            <span style={{ fontFamily: "var(--font-geist), sans-serif", color: 'var(--fe-accent)', fontWeight: 600, fontSize: 18 }}>
              FE
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: '-0.03em',
              color: 'var(--fe-black)',
              marginBottom: 4,
            }}
          >
            Future Events
          </h1>
          <p style={{ fontSize: 13, color: 'var(--fe-text-muted)' }}>
            Sistema de gestão de eventos
          </p>
        </div>

        {/* Card de login */}
        <div
          className="rounded-xl p-7"
          style={{
            background: 'var(--fe-surface)',
            border: '1px solid var(--fe-border)',
            boxShadow: 'var(--fe-shadow-card)',
          }}
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--fe-text-soft)' }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--fe-radius-md)',
                  border: '1px solid var(--fe-border)',
                  background: 'var(--fe-surface)',
                  fontSize: 13.5,
                  color: 'var(--fe-text)',
                  outline: 'none',
                  transition: 'border-color var(--fe-dur-fast)',
                  width: '100%',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--fe-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--fe-border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="senha"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--fe-text-soft)' }}
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--fe-radius-md)',
                  border: '1px solid var(--fe-border)',
                  background: 'var(--fe-surface)',
                  fontSize: 13.5,
                  color: 'var(--fe-text)',
                  outline: 'none',
                  transition: 'border-color var(--fe-dur-fast)',
                  width: '100%',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--fe-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--fe-border)')}
              />
            </div>

            {erro && (
              <p style={{ fontSize: 12.5, color: 'var(--fe-prio-urgent)', margin: 0 }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                marginTop: 4,
                height: 38,
                borderRadius: 'var(--fe-radius-md)',
                background: carregando ? 'var(--fe-text-faint)' : 'var(--fe-accent)',
                color: 'var(--fe-accent-fg)',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: carregando ? 'not-allowed' : 'pointer',
                transition: 'background var(--fe-dur-fast)',
                width: '100%',
              }}
              onMouseEnter={(e) => !carregando && ((e.target as HTMLButtonElement).style.background = 'var(--fe-accent-hover)')}
              onMouseLeave={(e) => !carregando && ((e.target as HTMLButtonElement).style.background = 'var(--fe-accent)')}
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

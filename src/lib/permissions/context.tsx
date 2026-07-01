'use client'

import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import type { Capacidades, Papel } from './types'

export type PermMeta = {
  /** Capacidades por href de List, só para as Lists que o usuário pode ver. */
  capsPorHref: Record<string, Capacidades>
  papel: Papel | null
  isAdmin: boolean
}

const PermCtx = createContext<PermMeta>({ capsPorHref: {}, papel: null, isAdmin: false })

export function PermProvider({ value, children }: { value: PermMeta; children: React.ReactNode }) {
  return <PermCtx.Provider value={value}>{children}</PermCtx.Provider>
}

export function usePerm(): PermMeta {
  return useContext(PermCtx)
}

/**
 * Capacidades da List correspondente à rota atual.
 * `null` = a rota é uma List que o usuário NÃO pode ver (bloquear).
 * Faz match pelo href mais específico (maior prefixo).
 */
export function useListPerm(): Capacidades | null {
  const { capsPorHref } = usePerm()
  const pathname = usePathname()
  let melhor: { href: string; caps: Capacidades } | null = null
  for (const href of Object.keys(capsPorHref)) {
    if (pathname === href || pathname.startsWith(href + '/')) {
      if (!melhor || href.length > melhor.href.length) melhor = { href, caps: capsPorHref[href] }
    }
  }
  return melhor?.caps ?? null
}

'use client'

import { createContext, useContext } from 'react'
import { CAPS_TOTAL, type Capacidades } from '@/lib/permissions/types'

/**
 * Contexto local do motor de Lists: capacidades do usuário nesta List
 * (Ver/Comentar/Editar/Total). A edição inline (InlineField, StatusDot) e os
 * controles de criar/apagar consomem isto. Default: tudo liberado (compatível
 * com telas que ainda não passam o contexto).
 */
const ListCapsContext = createContext<Capacidades>(CAPS_TOTAL)

export function ListEditProvider({ caps, children }: { caps: Capacidades; children: React.ReactNode }) {
  return <ListCapsContext.Provider value={caps}>{children}</ListCapsContext.Provider>
}

export function useListCaps(): Capacidades {
  return useContext(ListCapsContext)
}

/** Atalho: só o "pode editar", usado pela edição inline. */
export function useListEditable(): boolean {
  return useContext(ListCapsContext).canEdit
}

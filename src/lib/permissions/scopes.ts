// Mapeia a navegação (Space > Folder > List do nav.ts) para "escopos" de
// permissão. Um escopo é (tipo, slug):
//   • space  → space.slug                    ex.: 'marketing'
//   • folder → `${space.slug}/${folder.slug}` ex.: 'marketing/criacao'
//   • list   → href sem a barra inicial       ex.: 'marketing/criacao/copy'

import { NAV, type NavSpace } from '@/lib/nav'
import type { EscopoTipo } from './types'

export type Escopo = { tipo: EscopoTipo; slug: string }
export function escopoKey(tipo: EscopoTipo, slug: string): string {
  return `${tipo}:${slug}`
}

/** A cadeia de escopos (do mais amplo ao mais específico) de uma List. */
export type CadeiaEscopo = {
  href: string
  space: Escopo
  folder: Escopo
  list: Escopo
  spaceLabel: string
  folderLabel: string
  listLabel: string
}

function listSlug(href: string): string {
  return href.replace(/^\//, '')
}

// Índice href → cadeia, construído uma vez.
const CADEIA_POR_HREF: Map<string, CadeiaEscopo> = (() => {
  const map = new Map<string, CadeiaEscopo>()
  for (const space of NAV) {
    for (const folder of space.folders) {
      for (const list of folder.lists) {
        map.set(list.href, {
          href: list.href,
          space: { tipo: 'space', slug: space.slug },
          folder: { tipo: 'folder', slug: `${space.slug}/${folder.slug}` },
          list: { tipo: 'list', slug: listSlug(list.href) },
          spaceLabel: space.label,
          folderLabel: folder.label,
          listLabel: list.label,
        })
      }
    }
  }
  return map
})()

export function cadeiaDaHref(href: string): CadeiaEscopo | null {
  return CADEIA_POR_HREF.get(href) ?? null
}

/** A cadeia a partir de um caminho de rota qualquer (pega o prefixo da List). */
export function cadeiaDoPath(pathname: string): CadeiaEscopo | null {
  for (const [href, cadeia] of CADEIA_POR_HREF) {
    if (pathname === href || pathname.startsWith(href + '/')) return cadeia
  }
  return null
}

export function todasAsCadeias(): CadeiaEscopo[] {
  return [...CADEIA_POR_HREF.values()]
}

/** Árvore Space→Folder→List com escopos e labels — para a tela de Acessos. */
export type EscopoArvore = {
  space: Escopo
  label: string
  folders: {
    folder: Escopo
    label: string
    lists: { list: Escopo; label: string; href: string }[]
  }[]
}

export function arvoreDeEscopos(): EscopoArvore[] {
  return NAV.map((space: NavSpace) => ({
    space: { tipo: 'space', slug: space.slug },
    label: space.label,
    folders: space.folders.map((folder) => ({
      folder: { tipo: 'folder', slug: `${space.slug}/${folder.slug}` },
      label: folder.label,
      lists: folder.lists.map((list) => ({
        list: { tipo: 'list', slug: listSlug(list.href) },
        label: list.label,
        href: list.href,
      })),
    })),
  }))
}

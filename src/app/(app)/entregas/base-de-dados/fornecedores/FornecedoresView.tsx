'use client'

import { useMemo, useState } from 'react'
import {
  SPACE_ENTREGAS, Breadcrumb, TabsToolbar, ColunasHeader, Row, CellNome, CellText,
  SlideOver, PropRow, EmptyState, Tag, Dash,
} from '@/components/list/kit'

const BASE = '/entregas/base-de-dados/fornecedores'
const SEG = ['Entregas', 'Base de dados', 'Fornecedores']
const TEMPLATE = 'minmax(0,1fr) 250px 150px 140px'

export type FornecedorRow = {
  id: string
  nome: string
  responsavel: string | null
  categorias: string[]
  email: string | null
  whatsapp: string | null
}

function Categorias({ cats, max = 3 }: { cats: string[]; max?: number }) {
  if (cats.length === 0) return <Dash />
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
      {cats.slice(0, max).map((c) => <Tag key={c} label={c} />)}
      {cats.length > max && <span style={{ fontSize: 11, color: 'var(--fe-text-faint)' }}>+{cats.length - max}</span>}
    </span>
  )
}

export function FornecedoresView({ fornecedores }: { fornecedores: FornecedorRow[] }) {
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? fornecedores.filter((f) => f.nome.toLowerCase().includes(q) || f.categorias.some((c) => c.toLowerCase().includes(q))) : fornecedores
  }, [fornecedores, busca])

  const aberto = sel ? fornecedores.find((f) => f.id === sel) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      <Breadcrumb space={SPACE_ENTREGAS} segments={SEG} />
      <TabsToolbar busca={busca} onBusca={setBusca} addHref={`${BASE}/novo`} addLabel="Adicionar fornecedor" />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {fornecedores.length === 0 ? (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
            titulo="Nenhum fornecedor cadastrado"
            descricao="Cadastre fornecedores para vinculá-los aos seus eventos."
            addHref={`${BASE}/novo`} addLabel="Adicionar fornecedor"
          />
        ) : (
          <>
            <ColunasHeader cols={[{ label: 'Nome', width: 'minmax(0,1fr)' }, { label: 'Categorias', width: '250px' }, { label: 'Responsável', width: '150px' }, { label: 'WhatsApp', width: '140px' }]} />
            {filtrados.map((f) => (
              <Row key={f.id} template={TEMPLATE} onClick={() => setSel(f.id)}>
                <CellNome avatar={f.nome}>{f.nome}</CellNome>
                <span style={{ minWidth: 0, overflow: 'hidden' }}><Categorias cats={f.categorias} /></span>
                <CellText>{f.responsavel ?? <Dash />}</CellText>
                <CellText>{f.whatsapp ?? <Dash />}</CellText>
              </Row>
            ))}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {aberto && (
        <SlideOver
          space={SPACE_ENTREGAS}
          segments={['Base de dados', 'Fornecedores']}
          expandHref={`${BASE}/${aberto.id}`}
          onClose={() => setSel(null)}
          title={aberto.nome}
        >
          <PropRow icon={<IcTag />} label="Categorias"><span style={{ display: 'inline-flex', gap: 5, flexWrap: 'wrap' }}><Categorias cats={aberto.categorias} max={6} /></span></PropRow>
          <PropRow icon={<IcUser />} label="Responsável">{aberto.responsavel ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcPhone />} label="WhatsApp">{aberto.whatsapp ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcMail />} label="Email">{aberto.email ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
        </SlideOver>
      )}
    </div>
  )
}

function IcTag() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 2.5H6.5L11.5 7.5L7.5 11.5L2.5 6.5V2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="4.8" cy="4.8" r="0.7" fill="currentColor" /></svg> }
function IcUser() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.6" r="2.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 11.5C2.5 9.2 4.5 8 7 8S11.5 9.2 11.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> }
function IcPhone() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3C3 3 3.5 2.5 4.2 2.5C4.8 2.5 5.2 4 5.4 4.6C5.6 5.2 4.8 5.6 4.6 6C5.2 7.2 6.8 8.8 8 9.4C8.4 9.2 8.8 8.4 9.4 8.6C10 8.8 11.5 9.2 11.5 9.8C11.5 10.5 11 11 11 11C8 11.6 2.4 6 3 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg> }
function IcMail() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 4L7 7.5L11.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg> }

'use client'

import { useMemo, useState } from 'react'
import {
  SPACE_COMERCIAL, Breadcrumb, TabsToolbar, ColunasHeader, Row, CellNome, CellText,
  SlideOver, PropRow, EmptyState, Dash,
} from '@/components/list/kit'

const BASE = '/comercial/gestao-de-clientes/clientes'
const SEG = ['Comercial', 'Gestão de clientes', 'Clientes']
const TEMPLATE = 'minmax(0,1fr) 170px 150px 140px 140px'

export type ClienteRow = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  whatsapp: string | null
  empresa: string | null
  cnpj_cpf: string | null
}

export function ClientesView({ clientes }: { clientes: ClienteRow[] }) {
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? clientes.filter((c) => c.nome.toLowerCase().includes(q) || (c.empresa ?? '').toLowerCase().includes(q)) : clientes
  }, [clientes, busca])

  const aberto = sel ? clientes.find((c) => c.id === sel) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--fe-surface)' }}>
      <Breadcrumb space={SPACE_COMERCIAL} segments={SEG} />
      <TabsToolbar busca={busca} onBusca={setBusca} addHref={`${BASE}/novo`} addLabel="Adicionar cliente" />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {clientes.length === 0 ? (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
            titulo="Nenhum cliente cadastrado"
            descricao="Adicione o primeiro cliente para começar a organizar o comercial."
            addHref={`${BASE}/novo`} addLabel="Adicionar cliente"
          />
        ) : (
          <>
            <ColunasHeader leftPad={20} cols={[{ label: 'Nome', width: 'minmax(0,1fr)' }, { label: 'Empresa', width: '170px' }, { label: 'CNPJ / CPF', width: '150px' }, { label: 'WhatsApp', width: '140px' }, { label: 'Telefone', width: '140px' }]} />
            {filtrados.map((c) => (
              <Row key={c.id} template={TEMPLATE} onClick={() => setSel(c.id)}>
                <CellNome avatar={c.nome}>{c.nome}</CellNome>
                <CellText>{c.empresa ?? <Dash />}</CellText>
                <CellText>{c.cnpj_cpf ?? <Dash />}</CellText>
                <CellText>{c.whatsapp ?? <Dash />}</CellText>
                <CellText>{c.telefone ?? <Dash />}</CellText>
              </Row>
            ))}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {aberto && (
        <SlideOver
          space={SPACE_COMERCIAL}
          segments={['Gestão de clientes', 'Clientes']}
          expandHref={`${BASE}/${aberto.id}`}
          onClose={() => setSel(null)}
          title={aberto.nome}
        >
          <PropRow icon={<IcBuilding />} label="Empresa">{aberto.empresa ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcId />} label="CNPJ / CPF">{aberto.cnpj_cpf ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcPhone />} label="WhatsApp">{aberto.whatsapp ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcPhone />} label="Telefone">{aberto.telefone ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
          <PropRow icon={<IcMail />} label="Email">{aberto.email ?? <span style={{ color: 'var(--fe-text-faint)' }}>—</span>}</PropRow>
        </SlideOver>
      )}
    </div>
  )
}

function IcBuilding() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="2" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M5.5 4.5H8.5M5.5 6.5H8.5M5.5 8.5H8.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg> }
function IcId() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 6H6M4.5 8H7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg> }
function IcPhone() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3C3 3 3.5 2.5 4.2 2.5C4.8 2.5 5.2 4 5.4 4.6C5.6 5.2 4.8 5.6 4.6 6C5.2 7.2 6.8 8.8 8 9.4C8.4 9.2 8.8 8.4 9.4 8.6C10 8.8 11.5 9.2 11.5 9.8C11.5 10.5 11 11 11 11C8 11.6 2.4 6 3 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg> }
function IcMail() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 4L7 7.5L11.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg> }

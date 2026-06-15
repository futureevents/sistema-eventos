@AGENTS.md

# Sistema Eventos — Contexto do Projeto

Sistema interno de gestão de eventos para a Future Events. Construído com Next.js (App Router), Supabase e Tailwind CSS.

## Arquitetura de navegação: Spaces > Folders > Lists

A navegação segue a mesma hierarquia do ClickUp: **Space → Folder → List**. Os Spaces e Folders são **fixos** (hardcoded no código). Cada List tem comportamento, campos e automações específicos definidos em código — não são genéricos.

### Spaces e sua estrutura

#### Space: Comercial
- **Folder: Oportunidades**
  - List: Geração de novas oportunidades
  - List: Renovações & upgrades
- **Folder: Gestão de clientes**
  - List: Clientes

#### Space: Entregas
- **Folder: Projetos**
  - List: Pré-evento *(tarefas de planejamento pré-evento)*
  - List: Intra-evento *(tarefas durante o evento)*
  - List: Pós-evento *(tarefas de encerramento)*
  - List: Orçamento
  - List: Financeiro *(contas pagas, orçamento definitivo, gestão de pagamentos)*
- **Folder: Base de dados**
  - List: Eventos ← **já implementada na fatia 2**
  - List: Fornecedores
- **Folder: Patrocínios**
  - List: Captação de patrocinadores
  - List: Patrocinadores fechados
- **Folder: Entrada de clientes**
  - List: Tarefas de onboarding
  - List: Gestão de entregas *(reuniões de followup, moodboard, etc)*
- **Folder: Científico**
  - List: Grade do evento *(palestras, aulas, simpósios, etc)*
  - List: Compra de passagens

#### Space: Gestão
- **Folder: Acessos**
  - List: Emails e Redes sociais
  - List: Ferramentas
- **Folder: Rotinas organizacionais**
  - List: Reuniões Gerais
  - List: Reuniões internas
  - List: Rotinas internas
- **Folder: Jurídico**
  - List: Gestão de contratos *(cada contrato tem um type: cliente, fornecedor, etc)*
  - List: Tarefas jurídico

#### Space: Marketing
- **Folder: Criação**
  - List: Processo de copy
  - List: Design e criação
  - List: Publicações e disparos
- **Folder: Desenvolvimento web**
  - List: Landing pages e websites
  - List: Formulários

---

## Regras de implementação

- Spaces e Folders são fixos — nunca criar tabelas `space` ou `folder` no banco. Eles existem apenas como estrutura de navegação no código.
- Cada List é implementada como uma rota e componente próprio com campos e lógica específicos.
- Lists podem se comunicar entre si (automações). Ex: criar um Evento em Base de dados pode disparar tarefas em Pré-evento.
- A tabela `evento` no Supabase corresponde à List **Eventos** do Folder Base de dados do Space Entregas.
- A tabela `cliente` no Supabase corresponde à List **Clientes** do Folder Gestão de clientes do Space Comercial.

## Roteamento

```
/[space]/[folder]/[list]
```

Exemplos:
- `/entregas/base-de-dados/eventos` → List de Eventos
- `/comercial/gestao-de-clientes/clientes` → List de Clientes
- `/entregas/projetos/pre-evento` → List Pré-evento

## Fatias entregues

- **Fatia 1**: Shell do app (auth, layout, sidebar básica)
- **Fatia 2**: CRUD de Eventos (List: Eventos, rotas `/eventos/*`) — ainda com rotas antigas, será migrado para `/entregas/base-de-dados/eventos` na fatia 3

## Próxima fatia

- **Fatia 3**: Reestruturar sidebar com hierarquia Spaces > Folders > Lists e migrar rotas para o novo padrão.

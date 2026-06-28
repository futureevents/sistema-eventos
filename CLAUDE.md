@AGENTS.md

# Sistema Eventos — Contexto do Projeto

Sistema interno de gestão de eventos para a Future Events. Construído com Next.js (App Router), Supabase e Tailwind CSS.

## Nomenclatura (igual à do ClickUp)

O sistema adota o vocabulário do ClickUp. Use **sempre** estes termos no código, na UI e nas conversas:

- **Space** — agrupador de mais alto nível (Comercial, Entregas, Gestão, Marketing). Fixo no código.
- **Folder** — agrupador dentro de um Space (ex.: Projetos, Base de dados). Fixo no código.
- **List** — coleção de itens com comportamento, campos e automações próprios (ex.: Eventos, Clientes, Pré-evento). Implementada em código via o motor config-driven.
- **View** — uma forma de visualizar os itens de uma List (lista/tabela, board, calendário, etc.). Uma List pode ter várias Views.
- **Task** — **o item universal do sistema**: cada linha de qualquer List é uma Task. Ver seção abaixo.
- **Custom field** — campo personalizado específico de uma List/Folder/Space, declarado na config daquela List.

> Regra de ouro: **todo item de qualquer List é uma Task.** Um cliente é uma Task, um fornecedor é uma Task, um evento é uma Task, uma tarefa de pré-evento é uma Task, um anúncio em Marketing › Processo de copy é uma Task. Não existe "registro", "item" ou "card" como conceito separado — é tudo Task. As Lists diferem apenas pelos custom fields, automações e exceções de anatomia.

## Anatomia padrão da Task

Toda Task compartilha uma anatomia comum. Por padrão, uma Task contém:

1. **Nome** da task.
2. **Responsável** (assignee).
3. **Data de início e término** — exceto poucas exceções (ex.: Clientes não usam datas).
4. **Custom fields** — os campos próprios daquela List/Folder/Space.
5. **Descrição em rich text** — editor clean estilo ClickUp: comandos de barra `/` para ativar títulos (H1/H2/H3), listas, etc.; markdown inline ao digitar (`-` ou `1.` no início do parágrafo viram bullet/lista numerada); ao selecionar texto, barra flutuante com negrito, itálico, cor, H1/H2/H3, bullet e lista numerada.
6. **Checklists** — espaço para criar uma ou mais checklists.
7. **Attachments / anexos**.
8. **Histórico de atividade** — log da task (criação, mudança de status, mudança de prioridade, edições de campos, etc.).
9. **Prioridade**.
10. **Comentários** — em formato de chat com rich text, igual ao do ClickUp.
11. **Relacionamentos** — vínculos com outras Tasks (ex.: na Task de um Cliente, ver os Eventos já feitos com ele; na Task de um Fornecedor, ver os Eventos em que ele foi usado).
12. **Mostrar/esconder** custom fields e checklists.

Exceções por List (ex.: Clientes sem datas) são declaradas na config da List, não tratadas como casos especiais espalhados pelo código. A anatomia é entregue pelo motor de Lists; cada List só declara o que difere do padrão.

## Arquitetura de navegação: Space > Folder > List > View > Task

A navegação segue a mesma hierarquia do ClickUp: **Space → Folder → List → View → Task**. Os Spaces e Folders são **fixos** (hardcoded no código). Cada List tem comportamento, campos e automações específicos definidos em código — não são genéricos.

### Spaces e sua estrutura

#### Space: Comercial
- **Folder: Oportunidades** *(CRM de leads — tabela única `task_oportunidade` por `tipo`)*
  - List: Tráfego Pago *(leads inbound de anúncios; pipeline LEAD → … → NEGÓCIO FECHADO)*
  - List: Prospeção Ativa *(outbound; pipeline próprio — a definir)*
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
- Todo item de qualquer List é uma **Task** e herda a anatomia padrão (ver acima). Cada List declara apenas seus custom fields, automações e exceções de anatomia na config — não se reimplementa a anatomia por List.
- Lists podem se comunicar entre si (automações) e Tasks podem ter **relacionamentos** entre si. Ex: criar um Evento em Base de dados pode disparar Tasks em Pré-evento; a Task de um Cliente lista os Eventos relacionados.
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

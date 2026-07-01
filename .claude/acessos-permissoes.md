# Acessos & Permissões — Sistema Future Events

> Documento de decisão para aprovação (Miguel + sócia).
> Define **quem acessa o quê** e **o que cada pessoa pode fazer** dentro do sistema.
> Última atualização: 30/06/2026.

---

## 1. O problema que estamos resolvendo

Hoje, qualquer pessoa que entra no sistema **vê tudo e pode mexer em tudo**. Não dá:

- O time inteiro enxerga o Space de **Marketing**, mesmo quem não trabalha nele.
- Qualquer um abre a List **Reuniões internas** (Gestão), que é sensível.
- Qualquer um pode **apagar tasks**, mudar status e editar descrições.

Precisamos de um controle **simples de operar** (na mão da equipe, sem virar burocracia) que resolva isso.

---

## 2. A ideia central: dois eixos

Todo controle de acesso aqui se resume a duas perguntas independentes:

| Eixo | Pergunta | Exemplo |
|------|----------|---------|
| **1. Onde a pessoa entra** | O que ela **vê**? | "Fulano não vê o Space Marketing" |
| **2. O que ela faz lá dentro** | Qual a **profundidade**? | "Fulano só visualiza; não edita nem apaga" |

Primeiro decidimos **onde** cada um entra; depois **quanto** pode mexer. Essa separação é o que mantém o sistema fácil de administrar.

---

## 3. Papéis (o teto de poder de cada pessoa)

Usamos o vocabulário do ClickUp — o mesmo do resto do sistema.

| Papel | Enxerga | Pode fazer |
|-------|---------|------------|
| **Proprietário** | Tudo | Tudo, incluindo **gerenciar acessos** e configurações. *(Miguel + sócia)* |
| **Administrador** | Tudo | Cria, edita, **apaga**, gerencia membros e automações. |
| **Membro** | Os Spaces/Lists **públicos** + o que for liberado pra ele | Depende do **nível** concedido em cada acesso (ver eixo 2). |
| **Convidado** | **Só** o que for explicitamente compartilhado | Normalmente só **Ver** ou **Comentar** (clientes, fornecedores, freelas). |

> **Simplificação importante:** não existe papel "gestor" separado. Na prática, um gestor é um **Membro** com nível **Total** na área dele. Um colaborador é um **Membro** com nível **Editar**. Menos papéis = mais fácil de administrar.

---

## 4. Os 4 níveis de ação (eixo 2)

Cada acesso que uma pessoa recebe (a um Space, Folder ou List) vem com um nível:

| Nível | Ver | Comentar | Criar / editar task, mudar status | Apagar task | Mexer em automação, estrutura e membros |
|-------|:---:|:--------:|:---------------------------------:|:-----------:|:---------------------------------------:|
| **Ver** | ✅ | — | — | — | — |
| **Comentar** | ✅ | ✅ | — | — | — |
| **Editar** | ✅ | ✅ | ✅ | — | — |
| **Total** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Apagar** e **mexer na estrutura** ficam reservados ao nível **Total** — é isso que garante "nem todo mundo pode apagar/alterar".

---

## 5. Como funciona a visibilidade (eixo 1)

Por padrão, para simplicidade:

- **Spaces e Lists são públicos** → todo **Membro** enxerga, com nível **Editar**.
- Marcamos como **privados** só os que precisam de sigilo. Um item privado **some** para quem não foi convidado.
- Podemos **liberar** um item privado para pessoas específicas, e **rebaixar** o nível de alguém em qualquer item (ex.: dar só "Ver").

### Exemplos reais do nosso sistema

| Situação | O que configuramos |
|----------|--------------------|
| Marketing só pra equipe de marketing | Space **Marketing** → **privado**. Libera a equipe de marketing com nível **Total/Editar**. |
| Reuniões internas restritas | List **Reuniões internas** (Gestão › Rotinas) → **privada**. Libera só a diretoria. |
| Estagiário que só acompanha | Membro com nível **Ver** ou **Comentar** nos Spaces dele. |
| Cliente vendo o cronograma dele | **Convidado** com **Ver** numa List específica. |

Cada acesso vira uma linha simples: **(pessoa · escopo · nível)** —
ex.: *"Ana · Space Marketing · Total"*, *"João · Reuniões internas · Ver"*.

---

## 6. Onde isso é operado

Tudo é gerenciado numa tela só: **Configurações › Acessos & permissões** (visível apenas para Proprietário e Administrador). Lá dá para:

- Ver a **lista de membros**, com papel e status (ativo/inativo).
- **Trocar o papel** de alguém e **desativar** quem sai da empresa.
- Marcar um **Space/List como privado ou público**.
- **Liberar/remover** o acesso de uma pessoa a um escopo, escolhendo o nível.

---

## 7. Plano de entrega (3 fases)

Da mais barata e útil para a mais trabalhosa. Cada fase já entrega valor sozinha.

| Fase | O que entrega | Esforço | Prioridade |
|------|---------------|:-------:|:----------:|
| **1 — Fundação** | Papéis (Proprietário/Admin/Membro), Spaces privados, sidebar filtrada, tela de Acessos. Resolve ~80% ("Marketing privado", "Fulano é só Membro"). | Médio | 🔴 Já |
| **2 — Controle fino** | Restrição por List específica + os 4 níveis (Ver/Comentar/Editar/Total) travando a edição. | Médio | 🟡 Em seguida |
| **3 — Convidados externos** | Compartilhar itens pontuais com cliente/fornecedor de fora. | Alto | 🟢 Depois |

> Nesta primeira construção entregamos **Fases 1 e 2 juntas** (papéis + privacidade por Space **e** por List + os 4 níveis). O papel **Convidado** já fica no modelo; o fluxo completo de convite externo (Fase 3) entra num segundo momento.

---

## 8. Nota de segurança (transparência)

- **Login** já é individual (e-mail/senha via Supabase).
- As regras de "quem vê / quem edita" são aplicadas **no servidor** ao carregar cada tela e reforçadas na interface (botões de apagar/editar somem para quem não pode).
- A administração de acessos (trocar papel, liberar escopo) roda **no servidor**, só para Proprietário/Administrador — ninguém consegue se autopromover pela interface.
- **Endurecimento futuro (Fase 3):** aplicar as mesmas regras diretamente na camada do banco (RLS por escopo), como blindagem extra para quando houver convidados externos de fato. Documentado como próximo passo — não é bloqueador para uso interno.

---

## 9. Decisões que precisam do "de acordo" de vocês

1. **Quem é Proprietário?** (sugestão: Miguel + sócia)
2. **Quem é Administrador?** (quem mais mexe em acessos no dia a dia)
3. **Quais Spaces/Lists nascem privados?** (sugestão inicial: Space **Marketing**, List **Reuniões internas**, List **Jurídico**, Folder **Financeiro/Orçamento**)
4. **Nível padrão do Membro comum:** Editar (recomendado) ou Comentar?

Com esse "de acordo", a configuração inicial leva minutos na tela de Acessos.

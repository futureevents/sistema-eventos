# Conectar o Sistema de Eventos no seu Claude Code

Este guia liga o seu Claude Code ao **assistente do Sistema de Eventos**. Depois de
conectar, você pode perguntar coisas como *"quais as urgências desta semana?"* ou pedir
*"cadastre o cliente X e inicie a execução do evento Y"* direto no terminal.

> Você vai precisar de **2 coisas** que o Miguel te passa por mensagem privada:
> a **URL** do sistema e o **seu token pessoal** (não compartilhe seu token com ninguém).

---

## Passo 1 — Instalar o Claude Code (só na primeira vez)
Se ainda não tem, instale seguindo: https://docs.claude.com/claude-code
Confirme no terminal: `claude --version`.

## Passo 2 — Conectar ao sistema (um comando)
Cole no terminal, trocando `SEU_TOKEN` pelo token que você recebeu:

```bash
claude mcp add --transport http sistema-eventos \
  https://sistema.futureevents.com.br/api/mcp \
  --header "Authorization: Bearer SEU_TOKEN"
```

Pronto — fica salvo no seu Claude Code. Você só faz isso uma vez.

## Passo 3 — Usar
Abra o Claude Code (`claude`) e pergunte, por exemplo:
- "Quais são as principais urgências desta semana?"
- "Quais as minhas pendências?"
- "Liste os eventos em execução."
- "Cadastre o cliente Acme (email contato@acme.com) e crie uma task de pré-evento para ele."
- "Comente 'aguardando aprovação do cliente' na task X."

---

## Dúvidas rápidas
- **Deu erro 401 / "token inválido":** seu token está errado ou foi desativado — fale com o Miguel.
- **Quero remover a conexão:** `claude mcp remove sistema-eventos`.
- **Ver se está conectado:** `claude mcp list`.
- **Segurança:** seu token é pessoal e identifica suas ações no sistema. Se vazar, avise para
  desativarmos e gerar outro.

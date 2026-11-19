# Agentes no Projeto Cupuacu

Este monorepo Nx usa npm. O frontend Angular com SSR fica em `frontend/` e a API NestJS em `backend/`. O remoto `origin` aponta para `cleirfilho/projeto-cupuacu`, com branch principal `main`.

## Contexto e precedencia

Leia [rules.md](rules.md) antes de planejar, implementar ou revisar mudancas. Dentro do projeto, siga a instrucao direta do usuario, depois as regras canonicas e, por fim, o procedimento da skill ativa.

## Roteamento

Leia o `SKILL.md` correspondente quando a tarefa exigir o procedimento. Se a ferramenta nao descobrir as skills automaticamente, abra o arquivo indicado abaixo.

| Tarefa | Skill |
| --- | --- |
| Planejar uma funcionalidade, correcao ou refatoracao | [planejamento-de-implementacao](.agents/skills/planejamento-de-implementacao/SKILL.md) |
| Resolver conflitos em merge ou rebase | [resolucao-de-conflitos-git](.agents/skills/resolucao-de-conflitos-git/SKILL.md) |
| Revisar um diff, branch ou pull request | [revisao-de-codigo](.agents/skills/revisao-de-codigo/SKILL.md) |
| Criar, revisar ou executar testes | [cupuacu-testes](.agents/skills/cupuacu-testes/SKILL.md) |

Use o plugin oficial do GitHub no Codex para consultar issues e PRs quando fizerem parte da tarefa. O [guia de configuracao](docs/programacao-agentica.md) e referencia para pessoas.

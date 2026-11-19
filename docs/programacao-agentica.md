# Programação agêntica

Abra Codex, Claude Code ou Gemini CLI na raiz do repositório. O [AGENTS.md](../AGENTS.md) indica quando ler as [regras do projeto](../rules.md) e ativar cada skill. Os adaptadores `CLAUDE.md` e `GEMINI.md` importam a mesma entrada. A descoberta automática varia por cliente. O roteamento explícito permite abrir cada skill pelo caminho no repositório.

## GitHub no Codex

Use o plugin oficial do GitHub no Codex para consultar issues e pull requests de `cleirfilho/projeto-cupuacu`. O remoto Git `origin` aponta para o mesmo repositório.

## Exemplos

- Planeje a implementação da issue informada e liste os casos de teste.
- Revise a branch atual contra `origin/main`.
- Execute os testes do frontend relacionados à mudança de autenticação.

## Referências técnicas

- Organização por funcionalidade e coesão de componentes no [guia de estilo Angular](https://angular.dev/style-guide). Restrições das APIs do navegador em [SSR](https://angular.dev/guide/ssr).
- Seleção de tarefas pelo grafo e pelo diff em [Nx affected](https://nx.dev/docs/features/ci-features/affected). Restrições entre projetos em [Nx module boundaries](https://nx.dev/docs/features/enforce-module-boundaries).
- Organização em [módulos NestJS](https://docs.nestjs.com/modules), [validação com DTOs](https://docs.nestjs.com/techniques/validation) e [testes com NestJS](https://docs.nestjs.com/fundamentals/testing).
- Formato de [Agent Skills](https://agentskills.io/specification) e importação de contexto em [Claude Code](https://code.claude.com/docs/en/memory) e [Gemini CLI](https://geminicli.com/docs/cli/gemini-md/).

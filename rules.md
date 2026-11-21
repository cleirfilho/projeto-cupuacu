# Regras do Projeto Cupuacu

## Workspace Nx

- Use npm e preserve o `package-lock.json`. Instale a partir do lockfile com `npm ci`. O Dev Container usa Node 22.
- Execute comandos na raiz. Consulte `nx.json` e os `project.json` para identificar os alvos disponiveis, inclusive os inferidos pelos plugins. Use `npx nx show project frontend` ou `npx nx show project backend` para ver a configuracao efetiva.
- Mantenha frontend e backend independentes. Use o contrato HTTP da API para integracao entre eles. Se surgir uma necessidade concreta de compartilhar codigo, use uma biblioteca Nx com API publica e limites definidos, sem importar arquivos internos de um aplicativo no outro.
- Use os alvos Nx correspondentes ao impacto. Para uma branch com `origin/main` atualizado localmente, use `npx nx affected -t lint test build --base=origin/main`. Para mudancas transversais ou quando a base nao estiver disponivel, use `npm run lint`, `npm test` e `npm run build` conforme o impacto.

## Frontend Angular

- Organize por funcionalidade nas areas existentes de `frontend/src/app`. Mantenha componentes standalone e coloque template, estilos e spec perto do componente. Preserve as convencoes de nomes dos arquivos vizinhos.
- Mantenha componentes focados na apresentacao e interacao. Centralize acesso HTTP e estado compartilhado nos servicos da funcionalidade ou de `core/`. Use signals para estado local reativo quando fizer sentido e RxJS para fluxos assincronos existentes.
- Preserve a hidratacao e os modos de renderizacao configurados por rota. Isole o uso de APIs como `window` e `localStorage` em caminhos exclusivos do navegador e proteja o acesso conforme o contexto de execucao.
- Use sempre o Bootstrap como base da interface. Priorize seus componentes, classes utilitarias e variaveis de tema. Crie classes e estilos personalizados apenas quando forem necessarios para preservar a identidade visual ou atender a um comportamento que o Bootstrap nao oferece.
- Preserve Bootstrap, os estilos do projeto e os fluxos existentes de autenticacao ao evoluir interfaces. Use HTML semantico e controles acessiveis por teclado.

## Backend NestJS

- Organize por modulo de dominio. Use controllers para HTTP, services para regras de negocio e repositorios TypeORM para persistencia. Exponha pelo modulo apenas os providers usados por outros dominios.
- Valide entradas com DTOs de classe e decoradores de `class-validator`, seguindo o `ValidationPipe` global. Preserve o prefixo `/api` e atualize a documentacao Swagger quando mudar o contrato.
- Aplique autenticacao e autorizacao no servidor usando os guards e papeis existentes. Retorne apenas os campos do contrato, sem hashes de senha, tokens internos ou dados sensiveis indevidos.
- Use variaveis de ambiente para configuracao. Documente novas chaves em `.env.example` com valores ficticios. Para mudancas de schema, trate a compatibilidade com dados existentes e use migracoes em ambientes persistentes. A sincronizacao atual do TypeORM serve ao desenvolvimento local.

## Testes e validacao

- Mantenha specs `*.spec.ts` colocadas perto do comportamento testado. Escreva descricoes que indiquem o comportamento e a condicao exercitada. Preserve os testes legados.
- Use Vitest pelo alvo `frontend:test` e Jest pelo alvo `backend:test`. Use TestBed quando o teste Angular precisar do contexto do framework e `@nestjs/testing` quando a injecao NestJS fizer parte do comportamento. Use Supertest quando precisar verificar o contrato HTTP.
- Selecione casos pelo risco da mudanca. Cubra regressao, caminhos de erro e autorizacao quando afetados. Testes de persistencia devem usar dados e bancos isolados. Uma execucao com zero testes coletados deve ser reportada como tal.
- Informe os comandos executados, o resultado e as validacoes pendentes. Informe cobertura medida somente se tiver gerado o relatorio.

## Git e GitHub

- Preserve alteracoes locais do usuario. Resolva conflitos pelo comportamento esperado de ambos os lados. Evite operacoes destrutivas e force push sem autorizacao explicita.
- Use a branch base indicada na issue ou PR. Na ausencia de uma base informada, use `origin/main` para comparacoes locais depois de conferir sua disponibilidade.
- Use `Closes #<numero>` somente quando uma issue real for resolvida integralmente. Registre no PR o escopo e a validacao executada. Envie commits, PRs ou comentarios ao GitHub quando o usuario autorizar a operacao.
- Mantenha credenciais fora dos arquivos versionados e da saida de comandos.

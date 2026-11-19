---
name: cupuacu-testes
description: Cria, revisa e executa testes no Projeto Cupuacu. Use para validar comportamentos Angular ou NestJS, investigar falhas ou medir cobertura.
---

1. Leia [rules.md](../../../rules.md). Inspecione o diff, as specs vizinhas e o alvo efetivo do projeto. Identifique quais comportamentos precisam ser exercitados.
2. Acrescente ou ajuste as specs pertinentes quando o pedido envolver mudanca de testes ou comportamento. Reproduza a regressao no teste sempre que viavel.
3. Execute `npx nx test frontend`, `npx nx test backend` ou `npm test` conforme o escopo. Para filtrar specs ou medir cobertura, consulte as opcoes do executor identificado e confirme quais testes foram coletados.
4. Investigue falhas com um comando focado. Confira se a expectativa do teste representa o contrato antes de altera-la. Registre o resultado, incluindo testes coletados e cobertura quando solicitada e medida.

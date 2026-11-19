---
name: revisao-de-codigo
description: Revisa alteracoes locais, branches e pull requests. Use para buscar regressoes, falhas de contrato e lacunas de teste.
---

1. Leia [rules.md](../../../rules.md). Identifique a base e o escopo. Para um PR, consulte descricao, diff e verificacoes disponiveis no GitHub. Para uma branch local, use `git diff <base>...HEAD` e inspecione separadamente mudancas locais se estiverem no escopo.
2. Siga os caminhos alterados ate os consumidores e testes relevantes. Verifique casos de erro, autorizacao, compatibilidade e SSR quando atingidos.
3. Relate achados em ordem de impacto, com arquivo, linha e condicao que dispara o problema. Informe as validacoes executadas e lacunas de verificacao.

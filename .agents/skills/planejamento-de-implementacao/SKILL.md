---
name: planejamento-de-implementacao
description: Planeja funcionalidades, correcoes e refatoracoes a partir de uma issue ou pedido. Use para definir escopo, etapas e criterios de aceite antes de implementar.
---

1. Leia [rules.md](../../../rules.md). Se houver issue ou PR associado, consulte a descricao e os criterios no GitHub.
2. Localize os pontos de entrada e siga as dependencias para identificar os projetos e contratos afetados. Inspecione testes e configuracoes relacionados.
3. Escreva etapas em ordem de dependencia, com arquivos ou modulos provaveis. Registre efeitos sobre contratos, autorizacao, SSR ou dados existentes quando se aplicarem.
4. Defina criterios verificaveis e indique os alvos Nx pertinentes. Consulte a skill [cupuacu-testes](../cupuacu-testes/SKILL.md) para planejar a validacao.

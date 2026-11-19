---
name: resolucao-de-conflitos-git
description: Resolve conflitos em operacoes Git. Use quando merge, rebase ou cherry-pick deixar arquivos em conflito.
---

1. Leia [rules.md](../../../rules.md). Use `git status` e `git diff --name-only --diff-filter=U` para identificar a operacao e os arquivos.
2. Leia a base e as versoes do indice com `git show :1:<arquivo>`, `git show :2:<arquivo>` e `git show :3:<arquivo>`, quando disponiveis. Consulte os commits para entender a intencao, especialmente em rebase.
3. Resolva cada conflito preservando os comportamentos compativeis. Se a escolha depender de uma decisao de produto sem evidencia no repositorio, consulte o usuario.
4. Revise o diff, verifique a ausencia de marcadores nos arquivos resolvidos e execute os alvos afetados. Adicione ao indice apenas os arquivos resolvidos e conclua a operacao se estiver no escopo do pedido.

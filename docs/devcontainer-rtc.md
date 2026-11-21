# APIs da Reforma Tributária no Dev Container

Ao usar **Dev Containers: Reopen in Container**, o VS Code inicia o Compose da
pasta `.devcontainer` e executa o comando de desenvolvimento do serviço
`app`. As três APIs sobem junto com ele na rede padrão do Compose. O backend
NestJS recebe as URLs pelo ambiente e pode acessá-las pelo DNS do serviço.

| Serviço          | URL interna                            | URL no host Docker          | Swagger no host                                   |
| ---------------- | -------------------------------------- | --------------------------- | ------------------------------------------------- |
| Regime Regular   | `http://rtc-regime-regular:8080/api`   | `http://127.0.0.1:8081/api`   | `http://127.0.0.1:8081/api/swagger-ui.html`         |
| Simples Nacional | `http://rtc-simples-nacional:8082/api` | `http://127.0.0.1:8082/api` | `http://127.0.0.1:8082/api/swagger-ui.html`       |
| DANFSe           | `http://rtc-danfse:8080`               | `http://127.0.0.1:8083`     | `http://127.0.0.1:8083/api/swagger-ui/index.html` |

Se a porta 8081 estiver ocupada no host Docker, defina
`RTC_REGIME_REGULAR_HOST_PORT` no ambiente que executa o Compose e use a porta
escolhida para acessar a API e o Swagger pelo host.

O DANFSe recebe XML em `POST /api/danfse` e devolve PDF. O serviço registra logs
JSON com nível `info` e inicia com OpenTelemetry desabilitado. As APIs Java
usam o perfil `offline`. Seus healthchecks usam os endpoints Actuator nas portas
internas 9101 e 9103. O DANFSe usa `GET /health/ready`.

O Maven Wrapper compila os JARs com Java 25. Um estágio separado executa o
Flyway do Regime Regular com as migrations e o POM oficiais. Cada imagem Java
contém um catálogo inicial gerado no build. Na primeira inicialização pelo
Compose, cada serviço copia seu catálogo para a mesma pasta de
`backend/database.sqlite`, usando os arquivos
`backend/rtc-regime-regular.sqlite` e `backend/rtc-simples-nacional.sqlite`.
As APIs leem esses arquivos pelo caminho interno
`/app/calculadora/db/calculadora-pro.db`. Os arquivos são somente leitura para
as APIs e são reutilizados após recriar os containers. O Simples Nacional tem
um pin próprio das migrations.

## Arquivos

- `.devcontainer/docker-compose.yml` define serviços, portas, URLs internas e referências fixadas.
- `.devcontainer/services/rtc/.dockerignore` exclui arquivos locais do contexto de build.
- `.devcontainer/services/rtc/java.Dockerfile` gera os JARs e os bancos SQLite.
- `.devcontainer/services/rtc/danfse.Dockerfile` adapta o build upstream para a arquitetura nativa e fixa as imagens base.
- `.devcontainer/services/rtc/validar.sh` verifica saúde, Swagger e operações HTTP pelo host e pelo `app`.
- `.devcontainer/services/rtc/exemplo-nfse.xml` contém uma nota fictícia adaptada do teste de preparação upstream.
- `.env.example` registra as variáveis de integração.
- `README.md` aponta para este guia.

## Versões fixadas

Consultadas em 21/11/2026. O Compose registra a URL, a tag quando disponível e o
SHA completo. Os Dockerfiles baixam o código pelo SHA e gravam a identificação
em labels OCI. As imagens base das APIs também estão fixadas por digest.

| Origem                                                                                                                      | Versão                                       | SHA                                        |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| [Regime Regular](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/releases/tag/1.7.2)                       | 1.7.2                                        | `32df7196356e81f2df08e6023fc2b6dbc48036d3` |
| [Simples Nacional](https://github.com/ReceitaFederal/calculadora-rtc-simples-nacional/releases/tag/1.0.2)                   | 1.0.2                                        | `f90b6525e6d5823e784baecfc6fef0ad2f04b74f` |
| [DANFSe](https://github.com/AcesfContadores/calculadora-rtc-gerador-danfse/commit/8d79e6b2f7fad6375340afcb51c85ed370c64a14) | Commit da `main`, sem release ou tag estável | `8d79e6b2f7fad6375340afcb51c85ed370c64a14` |

## Build, estado e validação

Execute os comandos a partir da raiz, no host do Docker. Use o mesmo projeto
Compose do VS Code. Se houver um nome de projeto explícito, exporte
`COMPOSE_PROJECT_NAME` com esse nome. Para validar também sem VS Code, o
`up` abaixo inicia o `app` para servir de origem das requisições internas.

```bash
docker compose -f .devcontainer/docker-compose.yml build rtc-regime-regular rtc-simples-nacional rtc-danfse
docker compose -f .devcontainer/docker-compose.yml up -d --wait --wait-timeout 180
docker compose -f .devcontainer/docker-compose.yml ps
docker compose -f .devcontainer/docker-compose.yml logs --tail 100 rtc-regime-regular rtc-simples-nacional rtc-danfse
bash .devcontainer/services/rtc/validar.sh --recriar
```

O teste usa Bash, Docker Compose, curl e Python 3 no host. Consulta as UFs do
Regime Regular, as atividades vigentes do Simples e gera um PDF com o XML de
exemplo. A opção `--recriar` recria só as APIs e compara os hashes dos bancos
antes e depois. Para verificar uma única API sem recriar containers, passe o
nome do serviço.

## Atualização manual

1. Abra **Releases** e **Tags** na origem oficial. Compare as versões publicadas
   e descarte alpha, beta, RC, drafts e outros pré-lançamentos. Resolva a tag
   estável para o SHA do commit com a API abaixo. Se não houver tag estável,
   consulte `commits/main` e registre o SHA retornado.
2. Leia o changelog e confira os requisitos de runtime e banco. Atualize no
   Compose os campos `SOURCE_VERSION` e `SOURCE_SHA` do serviço escolhido.
   Para atualizar a base do Simples, revise também `MIGRATIONS_VERSION` e
   `MIGRATIONS_SHA` do próprio serviço. Atualize a tabela deste documento.
3. Se mudou o pin das migrations, mova o catálogo persistido para um backup
   antes de recriar o serviço. A inicialização copia o novo catálogo da imagem
   quando o arquivo persistido está ausente.
4. Reconstrua, recrie e teste apenas a API alterada. Se a versão for incompatível,
   registre a causa e fixe a versão estável compatível mais recente pelo mesmo
   procedimento.

```bash
repo=ReceitaFederal/calculadora-rtc-regime-regular
curl -fsSL "https://api.github.com/repos/$repo/releases?per_page=100"
curl -fsSL "https://api.github.com/repos/$repo/tags?per_page=100"
tag=1.7.2
curl -fsSL "https://api.github.com/repos/$repo/commits/$tag"
```

Siga a paginação indicada pelo cabeçalho `Link` se houver mais resultados.

```bash
servico=rtc-regime-regular
docker compose -f .devcontainer/docker-compose.yml build "$servico"
docker compose -f .devcontainer/docker-compose.yml up -d --wait --wait-timeout 180 --no-deps "$servico"
bash .devcontainer/services/rtc/validar.sh "$servico"
```

## Diagnóstico e regeneração

- Se houver conflito na porta publicada, altere apenas o lado do host no Compose
  e ajuste a porta correspondente em `validar.sh`. Em um host Docker remoto,
  use encaminhamento local para acessar as portas loopback a partir da estação.
- Se o build falhar, confira o acesso ao GitHub e ao registro de imagens, além
  de Maven Central ou Go Proxy, conforme o serviço. Para ver a saída completa,
  use `docker compose --progress plain -f .devcontainer/docker-compose.yml build <serviço>`.
- Se a API ficar unhealthy, consulte `ps` e `logs` do serviço. Nas APIs Java,
  verifique o caminho do SQLite e a presença do perfil `offline`.
- Para restaurar o catálogo inicial, mova o arquivo SQLite da calculadora
  para um backup e recrie o serviço com `up -d --wait --force-recreate --no-deps`.

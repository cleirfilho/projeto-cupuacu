# Kupuassu

Monorepo Nx com backend NestJS e frontend Angular para gestão contábil.

## Estrutura

- `backend/`: API NestJS, TypeORM, SQLite, JWT e Swagger
- `frontend/`: aplicação Angular standalone com SCSS
- `nx.json`: configuração do workspace Nx

## Desenvolvimento

Instale as dependências:

```bash
npm ci
```

Inicie backend e frontend juntos:

```bash
npm run start:dev
```

Ou execute separadamente:

```bash
npm run start:backend
npm run start:frontend
```

Serviços disponíveis:

- Frontend Angular: `http://localhost:4200`
- API NestJS: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

O servidor Angular usa `frontend/proxy.conf.json` para encaminhar chamadas em
`/api` ao backend durante o desenvolvimento.

## Comandos Nx

```bash
npm run build
npm run lint
npm test
npm run graph
```

Comandos por projeto:

```bash
npx nx build backend
npx nx serve backend
npx nx build frontend
npx nx serve frontend
```

## Banco e autenticação

O SQLite é armazenado em `backend/database.sqlite`. Na primeira inicialização,
o sistema cria o administrador:

- E-mail: `admin@cupuacu.local`
- Senha: `Admin@123`

Configure `JWT_SECRET` e `JWT_REFRESH_SECRET` com valores seguros fora do
ambiente de desenvolvimento. O Swagger pode ser desabilitado com
`SWAGGER_ENABLED=false`.

## Dev Container

Abra o projeto no VS Code e execute `Dev Containers: Reopen in Container`.
O container instala as dependências, encaminha as portas 3000 e 4200 e mantém o
UID/GID alinhado ao usuário do WSL.

O ambiente também inicia as três APIs da Reforma Tributária. Consulte as portas,
os testes e o procedimento de atualização no [guia das APIs RTC](docs/devcontainer-rtc.md).

## Programação agêntica

Consulte o [guia de programação agêntica](docs/programacao-agentica.md) para usar as instruções compartilhadas, as skills do projeto e a integração com o GitHub.

### Envio do formulário de contato

O formulário envia as mensagens pelo backend com Nodemailer. No `.env`, configure
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASS` com os dados da sua conta
SMTP. Use um remetente autorizado pelo provedor em `CONTACT_FROM` e a caixa que
deve receber as mensagens em `CONTACT_TO`. A resposta ao e-mail vai para o
endereço informado no formulário. Use a porta 465 para TLS direto ou a 587 para
STARTTLS. Reinicie o backend após editar o `.env`.

## Blog

O menu **Blog** do painel abre `/admin/blog` para contas com papel `ADMIN`.
Cadastre uma categoria, crie a publicação e escolha o status. O agendamento
usa o horário local informado no painel e grava a data em UTC. Na home, a
seção de novidades aparece quando há publicações públicas e o recurso está
ativo nas configurações do blog.

A migration TypeORM `CreateBlog1770000000000` roda automaticamente ao iniciar
a API. Faça backup do SQLite e do diretório de mídias antes de atualizar um
ambiente com dados. O diretório padrão é `<DATABASE_PATH>.blog-media`. Configure
`BLOG_MEDIA_PATH` para usar outro volume persistente. JPG, PNG e WebP estáticos
de até 5 MB são convertidos em WebP. O backend remove arquivos sem vínculo
após sete dias.

Em produção, configure `BLOG_SITE_URL` com a origem pública HTTPS e
`BLOG_API_ORIGIN` com a origem interna do NestJS. Inicie o servidor Angular
SSR depois do build para servir metadados, `/sitemap.xml` e o proxy de `/api`.
Por exemplo, com as origens definidas no arquivo `.env`:

```bash
npm run start:prod
# Em outro terminal
PORT=4000 node --env-file-if-exists=.env dist/frontend/server/server.mjs
```

Configure uma senha própria para a conta administrativa e os segredos JWT
antes de expor o painel. Use um `BLOG_VIEW_SECRET` aleatório para as chaves
diárias de visualização e para as sessões curtas de prévia de imagens. Se o
Nest estiver atrás de um proxy controlado, configure `BLOG_TRUST_PROXY_HOPS`
com o número de saltos confiáveis. Com o proxy do Angular diretamente à frente
do Nest, use `1`. O ranking registra no máximo uma visualização por
publicação e combinação de IP e navegador no mesmo dia UTC, com um limite por
IP. As chaves derivadas por HMAC expiram em 30 dias. O banco mantém os totais
de cada publicação.

A prévia do painel exige autenticação e não registra visualizações. A
renderização social usa a imagem Open Graph, a capa ou a imagem institucional.
Configure o domínio público no SSR para que redes sociais e buscadores possam
acessar essas URLs.

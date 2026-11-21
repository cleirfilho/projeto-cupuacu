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

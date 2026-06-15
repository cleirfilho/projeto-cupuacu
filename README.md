# Projeto Cupuaçu

API NestJS para gestão de empresa de contabilidade.

## Ambiente com Dev Container

Requisitos:

- Docker
- VS Code
- Extensão Dev Containers

Abra o projeto no VS Code e execute `Dev Containers: Reopen in Container`.
Na criação do container, as dependências são instaladas com `npm ci` e o arquivo
`.env` é criado a partir de `.env.example` quando necessário.

Dentro do container, inicie a API:

```bash
npm run start:dev
```

A API fica disponível em `http://localhost:3000`.

## Executar sem container

```bash
npm install
npm run start:dev
```

O SQLite é criado automaticamente em `database.sqlite`. Na primeira inicialização,
o sistema cria o administrador:

- E-mail: `admin@cupuacu.local`
- Senha: `Admin@123`

Configure `JWT_SECRET` e `JWT_REFRESH_SECRET` com valores seguros fora do ambiente
de desenvolvimento.

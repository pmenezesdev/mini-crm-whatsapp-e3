# Mini-CRM WhatsApp — E3 Digital

Teste técnico de Desenvolvedor(a) Full-Stack: mini-CRM com integração WhatsApp, autenticação via Google e isolamento de dados por unidade de negócio (multi-tenant).

## Deploy

- Frontend (Firebase Hosting): _a preencher após o deploy_
- Backend (Fly.io): _a preencher após o deploy_

## Arquitetura e decisões

O projeto é um monorepo gerenciado com **pnpm workspaces + Turborepo**, com `apps/api` (Node.js + Express + TypeScript), `apps/web` (Next.js App Router) e `packages/shared` (tipos TypeScript compartilhados entre os dois, evitando duplicar os contratos de API). O backend usa **PostgreSQL + Prisma** como banco: o domínio tem relações estritas (usuário pertence a uma unidade, conversa e mensagem pertencem a uma unidade) que se beneficiam de chaves estrangeiras e migrations versionadas — mais adequado aqui do que um banco de documentos. O campo `unitId` é denormalizado também em `Message` (além de vir via `Conversation`) para que o isolamento por unidade possa ser garantido com um filtro direto em cada query, em vez de depender de um `join` implícito.

A integração com o WhatsApp usa **Baileys** (`@whiskeysockets/baileys`), por ser mais leve que `whatsapp-web.js` (não depende de Chromium/Puppeteer, o que facilita rodar em container). Durante a implementação a versão resolvida por `^6.7.16` (6.17.16) acabou sendo uma release deprecated por uma vulnerabilidade de spoofing de mensagens — o `package.json` fixa a versão exata `6.7.23` (última da linha "legacy" com o patch) para evitar essa resolução. A conexão é única (um número de WhatsApp), e a unidade "dona" da conexão é marcada com a flag `isWhatsappOwner` no seed; o isolamento multi-unidade é demonstrado pelo fato de a unidade que não é dona simplesmente não ver nenhuma conversa, já que toda mensagem recebida é persistida associada ao `unitId` da unidade dona.

A autenticação usa **Firebase Authentication (Google Sign-In)** no frontend; o backend verifica o `idToken` recebido via `firebase-admin` e resolve a unidade do usuário casando por **email** contra a tabela `User` (populada por um script de seed, com os emails informados via variáveis de ambiente) — isso evita precisar saber o UID do Firebase antes do primeiro login. Como o backend também precisa estar acessível para a URL pública do Firebase Hosting funcionar de ponta a ponta (o requisito original só fala em publicar o frontend), o backend é publicado separadamente no **Fly.io** (suporta um container Docker persistente com volume, necessário para a sessão do Baileys sobreviver a restarts) com o banco de produção no **Neon** (Postgres gerenciado, free tier). O `docker-compose` local usa um Postgres em container e serve para desenvolvimento/avaliação local.

## Setup local

### Pré-requisitos

- Node.js 22+
- pnpm (`npm install -g pnpm`)
- Docker Desktop
- Um número de WhatsApp descartável/secundário (bibliotecas não-oficiais violam os ToS do WhatsApp — não use seu número principal)
- Um projeto Firebase com **Authentication (Google)** habilitado
- Duas contas Google (uma por unidade) para demonstrar o isolamento multi-unidade

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

Copie os três arquivos de exemplo e preencha:

```bash
cp .env.example .env                          # usado pelo docker-compose
cp apps/api/.env.example apps/api/.env         # usado se rodar a API fora do Docker
cp apps/web/.env.example apps/web/.env.local   # frontend
```

No `.env` (raiz):
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON da service account do Firebase Admin (Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada), em uma única linha.
- `SEED_USER_1_EMAIL` / `SEED_USER_2_EMAIL`: os dois emails Google que você vai usar para logar (um por unidade).

No `apps/web/.env.local`:
- `NEXT_PUBLIC_FIREBASE_*`: config web do Firebase (Firebase Console → Configurações do projeto → Seus apps → SDK setup). São valores públicos por design.
- `NEXT_PUBLIC_API_URL`: `http://localhost:3001` para desenvolvimento local.

### 3. Subir backend + banco

```bash
docker compose up --build
```

Isso sobe Postgres e a API, aplica as migrations do Prisma automaticamente e inicia a conexão com o WhatsApp.

### 4. Popular o banco (2 unidades, 1 usuário cada)

```bash
docker compose exec api node_modules/.bin/tsx prisma/seed.ts
```

### 5. Parear o WhatsApp

```bash
docker compose logs -f api
```

Escaneie o QR Code exibido no log (WhatsApp → Aparelhos conectados). Ele também fica disponível via `GET /api/whatsapp/status` (autenticado) e é exibido no frontend, na tela principal.

### 6. Testar o bot

Envie a mensagem `Oi` pelo WhatsApp para o número conectado. Deve chegar a resposta `Oi! Aqui é o Atendente da E3`, e a conversa deve aparecer no CRM para o usuário da unidade dona da conexão.

### 7. Rodar o frontend

```bash
pnpm --filter @e3/web dev
```

Abra `http://localhost:3000/login`, entre com a conta Google vinculada à unidade dona da conexão (`SEED_USER_1_EMAIL`) e veja a conversa. Para conferir o isolamento, abra uma janela anônima e entre com `SEED_USER_2_EMAIL` — a lista de conversas deve aparecer vazia.

## O que faria diferente com mais tempo

- Trocar o polling do frontend (mensagens e status do WhatsApp) por WebSocket/SSE para atualização em tempo real.
- Suportar mídia (imagem, áudio, documento) nas mensagens, hoje só texto é persistido.
- Permitir uma conexão WhatsApp por unidade (hoje é uma conexão global, atribuída a uma unidade "dona"), o que exigiria um pool de sessões Baileys.
- Um painel simples para vincular usuário → unidade em vez de um script de seed.
- Testes automatizados nos pontos críticos (middleware de auth, isolamento por unidade, handler de auto-resposta).
- CI (lint + typecheck + build) — não era exigido, mas ajudaria a travar regressões.
- Rate limiting e validação de payload mais estrita na API.

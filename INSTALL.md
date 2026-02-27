# 🚀 ConectaCG SaaS — Guia Completo de Instalação

## Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- npm 10+

---

## OPÇÃO A — Desenvolvimento Local

### 1. Banco de dados e Redis via Docker
```bash
docker compose -f docker-compose.dev.yml up -d
```
Isso sobe PostgreSQL na porta 5432 e Redis na 6379.

### 2. Configurar o backend
```bash
cd backend
cp .env.example .env
# Edite .env com suas configurações
```

Seu `.env` mínimo para desenvolvimento:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conectacg"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-key-minimo-32-caracteres-aqui"
JWT_REFRESH_SECRET="dev-refresh-secret-32-caracteres-aqui"
FRONTEND_URL="http://localhost:3000"
```

### 3. Instalar dependências e preparar banco
```bash
npm install
npm run db:generate    # Gera o Prisma client
npm run db:push        # Cria as tabelas no banco
npm run db:seed        # Popula com dados de teste
```

### 4. Iniciar o backend
```bash
npm run dev
# API disponível em http://localhost:4000
# Health check: http://localhost:4000/health
```

### 5. Iniciar o frontend (em outra aba)
```bash
cd ../  # pasta raiz do frontend Next.js
npm install
npm run dev
# Frontend disponível em http://localhost:3000
```

---

## OPÇÃO B — Docker Completo

### 1. Configurar variáveis de ambiente
```bash
cp .env.production.example .env
# Edite .env com suas configurações de produção
```

### 2. Build e start
```bash
docker compose up -d --build
```

### 3. Migrations e seed
```bash
docker exec conectacg_backend npx prisma db push
docker exec conectacg_backend npm run db:seed
```

---

## Estrutura de pastas

```
conectacg-saas/
├── backend/
│   ├── src/
│   │   ├── config/          # Env, Prisma, Redis, Stripe, Logger
│   │   ├── controllers/     # Handlers HTTP
│   │   ├── services/        # Lógica de negócio
│   │   ├── middlewares/     # Auth, Rate limit, Validate, Error
│   │   ├── routes/          # Definição de rotas
│   │   ├── jobs/            # Cron jobs (rankings, alertas, scraper)
│   │   ├── utils/           # Helpers (jwt, hash, response, errors)
│   │   ├── types/           # TypeScript types
│   │   └── server.ts        # Entry point
│   └── prisma/
│       ├── schema.prisma    # Schema completo
│       └── seed.ts          # Seed realista
├── frontend-patches/        # Patches do frontend Next.js
│   ├── b2b-dashboard/       # → app/b2b/dashboard/page.tsx
│   ├── b2b-leads/           # → app/b2b/leads/page.tsx
│   └── b2b-billing/         # → app/b2b/billing/page.tsx
├── tests/
│   ├── unit/                # Testes unitários (hash, jwt, pagination)
│   ├── integration/         # Testes de integração (auth, plans, b2b)
│   ├── setup.ts             # Configuração do ambiente de teste
│   └── vitest.config.ts     # Configuração do Vitest
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml       # Produção
├── docker-compose.dev.yml   # Desenvolvimento
└── Makefile                 # Atalhos de comandos

```

---

## Aplicar patches do frontend

### 1. Copiar arquivos do painel B2B:
```bash
# Do diretório raiz do projeto
mkdir -p app/b2b/dashboard app/b2b/leads app/b2b/billing

cp frontend-patches/b2b-dashboard/page.tsx app/b2b/dashboard/page.tsx
cp frontend-patches/b2b-leads/page.tsx app/b2b/leads/page.tsx
cp frontend-patches/b2b-billing/page.tsx app/b2b/billing/page.tsx
```

### 2. Adicionar variável de ambiente ao Next.js:
No seu `.env.local` do frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Rotas da API

### Autenticação
```
POST /api/v1/auth/register    Criar conta
POST /api/v1/auth/login       Login
POST /api/v1/auth/refresh     Renovar token
POST /api/v1/auth/logout      Logout
GET  /api/v1/auth/me          Perfil do usuário autenticado
```

### Planos (público / autenticado)
```
GET  /api/v1/plans            Listar planos (login gate: 2 vs todos)
GET  /api/v1/plans/:id        Detalhe do plano
POST /api/v1/plans/:id/click  Registrar clique
POST /api/v1/plans/:id/review Avaliar plano (autenticado)
POST /api/v1/plans/:planId/lead Capturar lead (contratar)
POST /api/v1/plans/recommend  Recomendação personalizada (autenticado)
```

### Favoritos (autenticado)
```
GET    /api/v1/favorites      Listar favoritos
POST   /api/v1/favorites/:planId Toggle favorito
DELETE /api/v1/favorites/:planId Toggle favorito
```

### Alertas (autenticado)
```
GET    /api/v1/alerts         Listar alertas
POST   /api/v1/alerts         Criar alerta
DELETE /api/v1/alerts/:id     Remover alerta
```

### Painel B2B (operadoras)
```
POST  /api/v1/b2b/register        Registrar operadora
GET   /api/v1/b2b/dashboard       Dashboard da operadora
GET   /api/v1/b2b/plans           Planos da operadora
POST  /api/v1/b2b/plans           Criar plano
PUT   /api/v1/b2b/plans/:planId   Atualizar plano
DELETE /api/v1/b2b/plans/:planId  Desativar plano
GET   /api/v1/b2b/leads           Central de leads
PATCH /api/v1/b2b/leads/:leadId   Atualizar status do lead
POST  /api/v1/b2b/billing/checkout  Checkout Stripe
POST  /api/v1/b2b/billing/portal    Portal de faturamento Stripe
```

### Analytics
```
POST /api/v1/analytics/track          Registrar evento (frontend)
GET  /api/v1/analytics/admin/stats    Stats gerais (SUPER_ADMIN)
```

### Webhooks
```
POST /webhooks/stripe    Webhook Stripe (raw body)
```

---

## Usuários de teste (após seed)
| Email                  | Senha    | Role        |
|------------------------|----------|-------------|
| joao@email.com         | senha123 | USER        |
| admin@conectacg.net    | senha123 | SUPER_ADMIN |

---

## Configurar Stripe (opcional)
1. Criar conta em https://stripe.com
2. Criar 3 produtos no Stripe Dashboard: Starter, Growth, Enterprise
3. Copiar os IDs dos preços para o `.env`
4. Configurar webhook em https://dashboard.stripe.com/webhooks
5. Adicionar endpoint: `https://seudominio.com/webhooks/stripe`
6. Selecionar eventos: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`

---

## Rodar testes
```bash
cd tests
npm install       # instala vitest e supertest
npm test          # roda todos os testes
npm run coverage  # relatório de cobertura
```

---

## Cron Jobs (executam automaticamente em produção)
| Job               | Schedule       | Descrição                        |
|-------------------|----------------|----------------------------------|
| recalculateRankings | a cada 6h    | Recalcula score dos planos       |
| processAlerts     | 8h diariamente | Verifica alertas de preço        |
| captureSnapshots  | 0h diariamente | Snapshot de preços para histórico|
| runScraper        | Segunda às 6h  | Ingestão de dados públicos       |

Para executar manualmente:
```bash
# Rankings
cd backend && npx tsx -e "import('./src/services/plan.service').then(s => s.recalculateRankings())"

# Alertas
cd backend && npx tsx -e "import('./src/services/alert.service').then(s => s.processAlerts())"

# Scraper
cd backend && npx tsx -e "import('./src/services/scraper.service').then(s => s.runScraper())"
```

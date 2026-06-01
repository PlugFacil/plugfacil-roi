# PlugFácil ROI Calculator

Calculadora de ROI para franquias e modelos de negócio PlugFácil.

## Stack

- **Framework**: Next.js 14
- **Banco**: PostgreSQL
- **Auth**: NextAuth
- **UI**: Radix UI + Tailwind CSS
- **ORM**: Prisma

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Copiar .env.example para .env.local
cp .env.example .env.local

# Executar migrations
npx prisma migrate dev

# Iniciar servidor dev
npm run dev
```

Acesse `http://localhost:3000`

**Credenciais padrão:**
- Email: `admin@plugfacil.com.br`
- Senha: `PlugFacil@2024`

## Deploy na Railway

### 1. Conectar GitHub

```bash
# Adicionar repositório remoto
git remote add origin https://github.com/seu-usuario/plugfacil-roi.git
git branch -M main
git push -u origin main
```

### 2. Configurar Railway

1. Acesse [railway.app](https://railway.app)
2. New Project → GitHub Repo
3. Selecione `plugfacil-roi`
4. Railway detectará automaticamente como Next.js

### 3. Adicionar PostgreSQL

Na Railway:
1. + New → Database → PostgreSQL
2. Railway gera automaticamente `DATABASE_URL`

### 4. Variáveis de Ambiente

Define na Railway:
```
NEXTAUTH_SECRET=seu-secret-aleatorio
NEXTAUTH_URL=https://app-roi.railway.app
DATABASE_URL=[gerado automaticamente pela Railway]
SEED_ADMIN_EMAIL=admin@plugfacil.com.br
SEED_ADMIN_PASSWORD=PlugFacil@2024
NODE_ENV=production
```

### 5. Deploy

Railway faz deploy automático a cada push em `main`.

## Estrutura

```
app/
├── dashboard/    # Páginas do dashboard
├── api/          # Rotas API
└── login/        # Página de login

components/      # Componentes reutilizáveis
lib/             # Utilitários (auth, prisma, etc)
prisma/          # Schema do banco
```

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm start        # Rodar build
npm run lint     # ESLint
```

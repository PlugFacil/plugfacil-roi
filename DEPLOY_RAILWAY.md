# Deploy na Railway — app-roi.railway.app

Guia passo a passo para colocar o calculador de ROI online.

## Custo estimado

- **Next.js app**: ~$15–20/mês
- **PostgreSQL**: ~$10–15/mês
- **Total**: ~$25–35/mês (Railway oferece $5/mês grátis)

---

## Pré-requisitos

- [ ] Conta GitHub (se não tiver: [github.com/signup](https://github.com/signup))
- [ ] Conta Railway (se não tiver: [railway.app](https://railway.app) → Sign Up)
- [ ] Repositório GitHub com este código

---

## Passo 1: Criar repositório no GitHub

```bash
# Se ainda não tem repositório remoto:
git remote add origin https://github.com/SEU_USUARIO/plugfacil-roi.git
git branch -M main
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu usuário no GitHub.**

---

## Passo 2: Conectar Railway ao GitHub

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **"New Project"**
3. Selecione **"GitHub Repo"**
4. Autorize Railway a acessar sua conta GitHub
5. Procure e selecione **`plugfacil-roi`**
6. Railway detectará automaticamente como Next.js

---

## Passo 3: Adicionar PostgreSQL

1. No dashboard do projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway cria automaticamente um banco e define `DATABASE_URL`

---

## Passo 4: Configurar variáveis de ambiente

Na aba **"Variables"** do projeto Railway, adicione:

```
NEXTAUTH_SECRET=seu-secret-aleatorio-aqui-32-caracteres
NEXTAUTH_URL=https://app-roi.railway.app
DATABASE_URL=[gerada automaticamente pelo PostgreSQL]
NODE_ENV=production
SEED_ADMIN_EMAIL=admin@plugfacil.com.br
SEED_ADMIN_PASSWORD=PlugFacil@2024
```

### Como gerar `NEXTAUTH_SECRET`:

```bash
# Terminal (em qualquer lugar)
openssl rand -base64 32
```

Copie o resultado e cole em `NEXTAUTH_SECRET`.

---

## Passo 5: Deploy automático

Railway faz deploy automático a cada push em `main`:

```bash
git push origin main
```

Você verá o deploy em tempo real no dashboard Railway.

---

## Passo 6: Executar migrations do banco

Após o primeiro deploy bem-sucedido:

1. Na aba **"Deploy"** do Railway, clique no último build
2. Vá para **"Logs"** e procure por erros
3. Se falhar na migration, execute manualmente via Railway:
   - Click no serviço → **"Railway CLI"** ou terminal do Railway
   - Execute:
     ```bash
     npx prisma migrate deploy
     ```

---

## Passo 7: Testar

1. Acesse **https://app-roi.railway.app**
2. Faça login com:
   - Email: `admin@plugfacil.com.br`
   - Senha: `PlugFacil@2024`
3. Teste criar uma simulação e gerar PDF

---

## Troubleshooting

### "Erro de conexão ao banco"
- Verifique se `DATABASE_URL` está configurada em Variables
- Rode `npx prisma migrate deploy` manualmente

### "Erro 502 Bad Gateway"
- Aguarde 2–3 minutos para o build completar
- Verifique logs do Railway

### "NextAuth erro de secret"
- Certifique-se que `NEXTAUTH_SECRET` tem pelo menos 32 caracteres

---

## Após o deploy

### Mudanças futuras

Toda vez que você fizer um commit e push para `main`:

```bash
git add .
git commit -m "descrição da mudança"
git push origin main
```

Railway faz deploy automaticamente em ~2 minutos.

### Escalar recursos (se necessário)

Se o app ficar lento com muitos usuários:
1. Railway → Configurações do serviço Next.js
2. Aumente "Memory" ou "CPU"
3. Deploy automático com novos recursos

---

## Links úteis

- Railway Dashboard: https://railway.app
- Documentação Railway: https://docs.railway.app
- NextAuth docs: https://next-auth.js.org

---

**Pronto! Seu app estará online em ~5 minutos.**

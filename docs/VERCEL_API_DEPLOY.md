# Deploy LibraAI API on Vercel

Project: **libra-ai-api** · Root directory: `apps/api`

Import: [Vercel – libraAI API](https://vercel.com/new/import?framework=express&path=apps%2Fapi&project-name=libra-ai-api)

## 1. Vercel project settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/api` |
| **Framework Preset** | Express |
| **Install Command** | `npm install --prefix=../..` |
| **Build Command** | `npx prisma generate && npm run build` |
| **Output Directory** | *(leave empty — Express serverless)* |

## 2. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Supabase pooled connection string |
| `DIRECT_URL` | Optional | Supabase direct URL for `prisma db push` from your machine |
| `JWT_SECRET` | Yes | Long random string |
| `CORS_ORIGIN` | Yes | Your frontend URL, e.g. `https://libraai.vercel.app` |
| `OPENAI_API_KEY` | Optional | For AI chat & semantic search |

### Supabase setup

1. Create project at [supabase.com](https://supabase.com)
2. Copy **Connection string** → URI (Transaction pooler) → `DATABASE_URL`
3. Copy **Direct connection** → `DIRECT_URL`
4. Run once locally:
   ```bash
   cd apps/api
   npx prisma db push
   npm run db:seed
   npm run db:seed-items
   ```

## 3. Connect frontend

On your **web** Vercel project, set:

```
VITE_API_URL=https://libra-ai-api.vercel.app
```

(No trailing slash)

## 4. Verify

```bash
curl https://libra-ai-api.vercel.app/health
# {"status":"ok","name":"LibraAI API"}
```

## Note

SQLite does not work on Vercel serverless. Use **PostgreSQL (Supabase)** for production.

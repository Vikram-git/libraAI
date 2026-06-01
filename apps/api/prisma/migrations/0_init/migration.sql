-- Enable pgvector (Supabase: already available in extensions)
CREATE EXTENSION IF NOT EXISTS vector;

-- Prisma will generate full migration on first `prisma migrate dev`
-- Run: npm run db:migrate --workspace=@libraai/api

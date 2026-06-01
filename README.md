# LibraAI – Smart Library Management Platform

A full-stack, AI-powered library management system built for placement portfolios. Demonstrates React 19, React Native, Node.js, PostgreSQL, Prisma, JWT auth, OpenAI integrations, and cloud deployment.

## Features

| Feature | Description |
|--------|-------------|
| AI Recommendations | Personalized home + collaborative filtering ("also borrowed") |
| Semantic Search | Natural language book search via OpenAI embeddings + pgvector |
| AI Librarian Chat | GPT-powered assistant with catalog context |
| Barcode Scanner | Expo mobile app — scan ISBN, auto-fill from Open Library |
| Admin Analytics | Borrow trends, fines, category popularity, active members |
| Smart Notifications | Due dates, reservations, fines, new arrivals |
| Wishlist & Reading Lists | Save favorites and track goals |
| Dark/Light Theme | Zustand-persisted theme on web |

## Tech Stack

- **Web:** React 19, TypeScript, Tailwind CSS v4, TanStack Query, Zustand, Framer Motion, React Router
- **Mobile:** React Native, Expo, Expo Router, expo-camera, expo-notifications
- **API:** Node.js, Express 5, Prisma, PostgreSQL, JWT, OpenAI
- **Deploy:** Vercel (web) · Railway (API) · Supabase (DB + pgvector)

## Project Structure

```
libraai/
├── apps/
│   ├── api/          # Express REST API + Prisma
│   ├── web/          # Vite React web app
│   └── mobile/       # Expo React Native app
├── package.json      # npm workspaces monorepo
├── docs/ITEMS_API.md # Items REST CRUD API documentation
├── postman/          # Postman collection for Items API
└── README.md
```

## Items REST API (MVP Assignment)

Full CRUD API on **SQLite** with Express (Node.js — equivalent to Flask/FastAPI assignment):

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/items` | 200 |
| POST | `/items` | 201 |
| GET | `/items/{id}` | 200 / 404 |
| PUT | `/items/{id}` | 200 / 404 |
| DELETE | `/items/{id}` | 200 / 404 |

**Extensions:** JWT auth (optional), pagination, filtering, Postman collection.

```bash
cd apps/api && npm run db:seed-items && npm run dev
# Test: http://localhost:4000/items
```

Import `postman/LibraAI-Items-API.postman_collection.json` into Postman.  
Full docs: [docs/ITEMS_API.md](docs/ITEMS_API.md)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) (use Supabase for easiest setup)
- OpenAI API key (for AI search, chat, embeddings)

### 1. Install dependencies

```bash
cd libraai
npm install
```

### 2. Configure API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL="postgresql://..."   # Supabase connection string
JWT_SECRET="your-long-secret"
OPENAI_API_KEY="sk-..."
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

**Supabase pgvector:** In Supabase Dashboard → Database → Extensions → enable `vector`.

### 3. Database setup

```bash
npm run db:push
npm run db:seed
```

Demo accounts after seed:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@libraai.com | password123 |
| Member | member@libraai.com | password123 |

### 4. Run development servers

```bash
# Terminal 1 – API
npm run dev:api

# Terminal 2 – Web
npm run dev:web

# Terminal 3 – Mobile (optional)
npm run dev:mobile
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Mobile: Scan QR with Expo Go

## API Endpoints (highlights)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register member |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/books/search/semantic?q=` | AI semantic search |
| GET | `/api/recommendations/for-you` | Personalized picks |
| POST | `/api/ai/chat` | AI Librarian chatbot |
| GET | `/api/analytics/dashboard` | Admin analytics |
| GET | `/api/isbn/:isbn` | ISBN lookup (Open Library) |
| POST | `/api/borrows/issue` | Librarian issue book |
| POST | `/api/borrows/:id/return` | Return + auto fine |

## Deployment

### Database (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Enable `vector` extension
3. Copy connection string to `DATABASE_URL`
4. Run `npm run db:push` locally against production DB (or use Supabase SQL editor)

### API (Railway)

1. Connect GitHub repo, set root to `apps/api`
2. Add env vars from `.env.example`
3. Build: `npm install && npx prisma generate`
4. Start: `node dist/index.js` (run `npm run build` first)

### Web (Vercel)

1. Import repo, set root to `apps/web`
2. Build: `npm run build`
3. Env: `VITE_API_URL=https://your-api.railway.app`

### Mobile (Expo EAS)

```bash
cd apps/mobile
npx eas build --platform android
```

Set `EXPO_PUBLIC_API_URL` to production API URL.

## Resume Talking Points

- Designed normalized PostgreSQL schema with Prisma (users, books, borrows, fines, reservations, wishlists)
- Implemented JWT RBAC (MEMBER, LIBRARIAN, ADMIN)
- Built semantic search pipeline: OpenAI embeddings → pgvector cosine similarity
- Added collaborative filtering recommendations and GPT-4o-mini librarian chat with RAG-style context
- Shipped responsive web UI with dark mode, animations, and admin analytics dashboard
- Built Expo mobile app with barcode scanning and offline catalog cache

## License

MIT

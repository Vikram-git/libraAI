# Items REST API — MVP Documentation

Base URL: `http://localhost:4000`

Stack: **Node.js + Express + Prisma + SQLite** (same as LibraAI backend)

## Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| `GET` | `/items` | List all items (pagination & filters) | 200 |
| `POST` | `/items` | Create item | 201, 400 |
| `GET` | `/items/{id}` | Get item by ID | 200, 404 |
| `PUT` | `/items/{id}` | Update item | 200, 400, 404 |
| `DELETE` | `/items/{id}` | Delete item | 200, 404 |

Alias: `/api/items` (same routes)

---

## 1. GET /items

**Query parameters (filtering & pagination):**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 100) |
| `q` | string | — | Search name/description |
| `category` | string | — | Filter by category |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `sortBy` | string | createdAt | name, price, quantity, createdAt |
| `sortOrder` | string | desc | asc or desc |

**Example:**
```http
GET /items?page=1&limit=5&category=electronics&sortBy=price&sortOrder=asc
```

**Response `200`:**
```json
{
  "items": [
    {
      "id": "clx...",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse",
      "price": 29.99,
      "quantity": 50,
      "category": "electronics",
      "userId": null,
      "createdAt": "2026-06-01T...",
      "updatedAt": "2026-06-01T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 8,
    "totalPages": 2
  }
}
```

---

## 2. POST /items

**Body (JSON):**
```json
{
  "name": "Keyboard",
  "description": "Mechanical keyboard",
  "price": 89.99,
  "quantity": 10,
  "category": "electronics"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| name | Yes | 1–200 chars |
| description | No | max 2000 chars |
| price | No | ≥ 0 (default 0) |
| quantity | No | int ≥ 0 (default 0) |
| category | No | max 100 chars |

**Response `201`:** Created item object

**Response `400`:** Validation error
```json
{ "error": "Name is required" }
```

---

## 3. GET /items/{id}

**Response `200`:** Item object

**Response `404`:**
```json
{ "error": "Item not found" }
```

---

## 4. PUT /items/{id}

**Body (JSON)** — at least one field:
```json
{
  "name": "Updated Keyboard",
  "price": 79.99,
  "quantity": 15
}
```

**Response `200`:** Updated item

**Response `404`:** Item not found  
**Response `400`:** Validation error

---

## 5. DELETE /items/{id}

**Response `200`:**
```json
{
  "message": "Item deleted successfully",
  "id": "clx..."
}
```

**Response `404`:** Item not found

---

## Extensions

### Authentication (optional)

Set in `apps/api/.env`:
```env
ITEMS_REQUIRE_AUTH=true
```

When enabled, `POST`, `PUT`, `DELETE` require header:
```http
Authorization: Bearer <JWT_TOKEN>
```

Get token:
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@libraai.com", "password": "password123" }
```

`GET` endpoints remain public.

### Database

SQLite via Prisma (`file:./dev.db`). Run:
```bash
cd apps/api
npx prisma db push
npm run db:seed-items
```

---

## Postman Testing Checklist

- [ ] GET /items → 200 with items array
- [ ] POST /items → 201 with new item
- [ ] GET /items/{id} → 200
- [ ] GET /items/invalid-id → 404
- [ ] PUT /items/{id} → 200 with updated fields
- [ ] DELETE /items/{id} → 200
- [ ] GET /items/{deleted-id} → 404
- [ ] POST with empty name → 400
- [ ] GET /items?category=electronics → filtered results
- [ ] GET /items?page=1&limit=2 → pagination works

---

## 3-Day Implementation Plan

| Day | Tasks |
|-----|-------|
| **Day 1** | Prisma Item model, `GET /items`, `POST /items`, seed data |
| **Day 2** | `PUT /items/{id}`, `DELETE /items/{id}`, Zod validation |
| **Day 3** | Postman collection, filtering/pagination, auth extension, this doc |

---

## Quick Start

```bash
cd C:\Users\vikro\libraai\apps\api
npx prisma db push
npm run db:seed-items
npm run dev
```

Test: `http://localhost:4000/items`

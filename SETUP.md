# WalkGraph — Setup Guide

## 1. Prerequisites

- Node.js 18+
- pnpm 10+
- PostgreSQL (local or managed: Neon, Supabase, Railway)

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required variables:

```
DATABASE_URL="postgresql://user:password@localhost:5432/walkgraph"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Database Setup

```bash
# Push schema to database (creates all tables)
pnpm db:push

# Or run migrations
pnpm exec prisma migrate dev --name init
```

## 4. Start Development

```bash
pnpm dev
```

Open http://localhost:3000

## 5. First Steps

1. Register an account at `/auth/register`
2. Create an organization at `/dashboard/organizations/new`
3. Create a building inside the organization
4. Add floors to the building
5. Go to **Nodes & Edges** — use the SVG graph editor:
   - **Add Node** mode: click on canvas to place nodes
   - **Add Edge** mode: click two nodes to connect them
6. Test routes at **Route Tester**
7. Generate QR codes at **QR Codes**
8. Publish the building — it appears at `/explore`

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS v3 |
| Auth | NextAuth v4 (credentials + Prisma adapter) |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Routing Engine | Custom Dijkstra (TypeScript) |
| QR Codes | qrcode npm package |

## Key Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/auth/login` | Sign in |
| `/auth/register` | Create account |
| `/dashboard` | Admin dashboard |
| `/dashboard/organizations` | Org list |
| `/dashboard/organizations/new` | Create org |
| `/dashboard/organizations/[orgId]` | Org detail + buildings |
| `/dashboard/buildings/[id]` | Building overview |
| `/dashboard/buildings/[id]/floors` | Floor management |
| `/dashboard/buildings/[id]/nodes` | **SVG Graph Editor** |
| `/dashboard/buildings/[id]/routes` | Route tester (Dijkstra) |
| `/dashboard/buildings/[id]/qr` | QR code generator |
| `/explore` | Public building search |
| `/explore/[buildingId]` | Building navigation page |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| GET/POST | `/api/organizations` | List / create orgs |
| GET/PATCH/DELETE | `/api/organizations/[orgId]` | Org CRUD |
| GET/POST | `/api/buildings` | List / create buildings |
| GET/PATCH/DELETE | `/api/buildings/[id]` | Building CRUD |
| POST | `/api/buildings/[id]/publish` | Toggle publish |
| GET | `/api/buildings/[id]/download` | Download offline package (JSON) |
| GET/POST | `/api/floors` | Floor CRUD |
| GET/POST | `/api/nodes` | Node CRUD |
| GET/PATCH/DELETE | `/api/nodes/[nodeId]` | Node detail |
| GET/POST | `/api/edges` | Edge CRUD |
| DELETE | `/api/edges/[edgeId]` | Delete edge |
| POST | `/api/route` | Find shortest path (Dijkstra) |
| GET | `/api/search` | Search nodes/buildings |
| GET | `/api/qr/[nodeId]` | Generate QR code |

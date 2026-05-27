# Project Conventions

You are working on **lx-music-server**, a Cloudflare Workers-based music sync server built with Hono.

## Architecture Overview

```
src/
├── index.ts          # Hono app entry, route mounting, WebSocket upgrade
├── constants.ts      # SYNC_CODE constants (auth messages, error codes)
├── durable/
│   └── UserSyncDO.ts # Durable Object: per-user WebSocket hub + SQLite storage
├── routes/
│   ├── auth.ts       # GET /ah — device auth (AES decrypt, IP rate limit)
│   ├── devices.ts    # Device management routes
│   └── hello.ts      # Health check
├── sync/             # WebSocket sync protocol layer
│   ├── handler.ts    # message2call RPC handler registration
│   ├── sync.ts       # Sync orchestration
│   ├── event.ts      # Event bus
│   └── index.ts      # Re-exports
├── modules/          # Feature modules (list, dislike)
│   ├── list/         # Playlist sync
│   └── dislike/      # Dislike list sync
│   └── [each module has]: index.ts, manage.ts, event.ts, *DataManage.ts, snapshotDataManage.ts, utils.ts, sync/
├── user/             # User state management within DO
├── utils/
│   ├── crypto.ts     # AES-CBC decrypt, MD5 (via @noble/hashes)
│   ├── compress.ts   # Compression utilities
│   └── common.ts     # Shared helpers
└── types/            # .d.ts type declarations
```

## Key Patterns

### Routing
- Routes are defined as separate Hono sub-apps in `src/routes/` and mounted in `index.ts` via `app.route('/', xxxRoutes)`
- Route files export a default Hono instance typed as `Hono<{ Bindings: LX.Env }>`

### Durable Objects
- `UserSyncDO` is the central DO — one instance per user (keyed by userName)
- It handles WebSocket connections, SQLite storage, and the sync protocol
- The DO uses `message2call` library for RPC-style WebSocket message handling
- DO-side requests come via `this.ctx.storage` (SQLite) and `this.env.KV` (cross-DO lookups)

### Authentication Flow
1. Client sends encrypted message (`m` header) + optional client ID (`i` header) to `GET /ah`
2. Server decrypts with AES-CBC using MD5(password)[0:16] as key
3. Decrypted text must start with `SYNC_CODE.authMsg`
4. Known devices: lookup KV `client:{clientId}` → userName → DO auth
5. New devices: iterate all users, try decrypt, on success create clientId → userName in KV
6. IP-based rate limiting (in-memory, 10 failures / 60s window)

### Sync Protocol
- Uses `message2call` for bidirectional RPC over WebSocket
- Each module (list, dislike) registers handlers and sync callbacks
- Snapshot-based sync: full snapshots + incremental patches
- Snapshot metadata stored in SQLite table `snapshot_info_{module}`

### Data Management Pattern
Each module follows:
- `*DataManage.ts` — CRUD for current data (read/write from SQLite)
- `snapshotDataManage.ts` — snapshot creation, listing, retrieval
- `manage.ts` — high-level business logic combining data + snapshot operations
- `sync/` — sync protocol handlers and event wiring

### Type Declarations
- `src/types/` contains `.d.ts` files declaring global `LX.*` namespaces
- These are ambient types (no import needed), used throughout the codebase
- Key namespaces: `LX.User`, `LX.Env` (Worker bindings), `LX.List.*`, `LX.Dislike.*`

## Code Style

- **Language**: TypeScript with strict mode (`"strict": true`)
- **Comments**: Chinese comments are intentional — preserve them
- **Imports**: Use `@/` path alias for `src/` imports
- **Error handling**: Prefer early returns over try/catch in route handlers
- **Naming**: 
  - Variables: camelCase
  - Types/Interfaces: PascalCase under `LX.*` namespace
  - Constants: UPPER_SNAKE_CASE (e.g., `SYNC_CODE`)
- **No test framework currently** — when adding tests, prefer Vitest with `@cloudflare/vitest-pool-workers`

## Constraints

- **Runtime**: Cloudflare Workers — no Node.js APIs, no filesystem, no long-running processes
- **Storage**: Cloudflare KV (key-value) + Durable Object SQLite (relational)
- **Crypto**: Only `@noble/hashes` and `aes-js` — no Node.js `crypto` module
- **DO limits**: 128MB SQLite storage per DO, 128KB max per row
- **KV limits**: 25MB max value size

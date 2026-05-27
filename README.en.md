# lx-music-server

A Cloudflare Workers port of [lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server), using Durable Objects for stateful WebSocket sync — no self-hosted server required.

[中文](./README.md)

## Features

- Runs on Cloudflare Workers + Durable Objects — zero server maintenance
- Multi-user isolation: each user gets a dedicated DO instance and storage
- Real-time bidirectional WebSocket sync for playlists and dislike rules
- Snapshot-based version management with multi-device incremental merge
- Device management API (list / revoke authorized devices)
- Cloudflare Git integration for automatic deployment — no GitHub Secrets needed

## Prerequisites

- A Cloudflare account (free plan is sufficient)
- A GitHub account (for forking the repo)

## Deployment

### 1. Create a Cloudflare KV Namespace

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages → KV**
3. Click **Create a namespace**
4. Enter a name (e.g. `lx-music-kv`) and click **Add**
5. After creation, click into the namespace — you'll see the **Namespace ID** on the details page. Copy it for later

### 2. Fork and modify wrangler.toml

1. Fork this repository
2. Edit `wrangler.toml` and fill in your KV Namespace ID:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"  # ← Replace with the ID from step 1
```

3. Commit and push to your fork

### 3. Connect Git repo for automatic deployment

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages → Create**
3. Select **Connect to Git**
4. Authorize and select your forked `lx-music-server` repository
5. Configure the build:
   - **Production branch**: `main`
   - **Build command**: `pnpm deploy`
   - Cloudflare will auto-detect the `packageManager` field and use pnpm
6. Click **Save and Deploy**

From now on, every push to the `main` branch will trigger an automatic redeployment on Cloudflare — no GitHub Secrets required.

### 4. Configure users

Configure user information in the [Cloudflare Dashboard](https://dash.cloudflare.com/):

1. Go to **Workers & Pages → lx-music-server**
2. Click **Settings → Variables and Secrets**
3. Click **Add**, select type **Secret**, enter the name `LX_USERS`, and enter your user configuration as the value

**Two formats are supported:**

**Simple format** (username:password, comma-separated):

```
admin:your_password,alice:her_password
```

**JSON format** (supports additional options):

```json
[{"name":"admin","password":"your_password"},{"name":"alice","password":"her_password","maxSnapshotNum":30}]
```

**Supported user options:**

| Option | Type | Description |
|---|---|---|
| `name` | string | Username (required) |
| `password` | string | Login password (required) |
| `maxSnapshotNum` | number | Maximum number of snapshots to retain, default 20 |
| `list.addMusicLocationType` | `"top"` \| `"bottom"` | Where new songs are added, default `"bottom"` |

> To add or modify users, simply update the `LX_USERS` Secret in Cloudflare Dashboard — no code changes or redeployment needed.

## Access URL

After deployment, the Worker is accessible via its default Workers domain, or you can bind a custom domain.

### Using the default Workers domain

The default URL is:

```
https://lx-music-server.<your-subdomain>.workers.dev
```

You can also find it in the Cloudflare Dashboard under **Workers & Pages → lx-music-server**.

### Using a custom domain (optional)

1. Add your domain to Cloudflare (**Websites → Add a site**) and follow the prompts to update your domain's NS records to point to Cloudflare
2. In the Cloudflare Dashboard, go to **Workers & Pages → lx-music-server**
3. Click **Settings → Domains & Routes → Add → Custom Domain**
4. Enter the subdomain you want to use (e.g. `sync.example.com`) and click **Add domain**
5. Cloudflare will automatically create the DNS record and issue an SSL certificate — wait for it to take effect

Once configured, you can access the service at `https://sync.example.com`.

> **Important:** Before switching to a different sync server, make sure to back up your local data to prevent data loss.

## Client Configuration

In LX Music's sync settings:

- **Server URL**: `https://<your-worker-name>.<your-subdomain>.workers.dev` (or your custom domain)
- **Password**: the corresponding password

## Local Development

```bash
pnpm install
pnpm dev
```

> `wrangler dev` simulates Durable Objects and KV locally.

### Manual deployment (optional)

To deploy to Cloudflare Workers from your local machine:

```bash
wrangler login    # Required on first run; opens browser for authorization
pnpm install
pnpm deploy
```

## Device Management API

All endpoints use HTTP Basic Auth with the same credentials as the sync account.

**List authorized devices:**

```bash
curl -u <username>:<password> https://<worker-url>/devices
```

**Revoke a device:**

```bash
curl -u <username>:<password> -X DELETE https://<worker-url>/devices/<clientId>
```

## Architecture

```
Client
  │
  ├─ GET  /ah              Authentication (new device / re-auth)
  ├─ GET  /socket          WebSocket upgrade → UserSyncDO
  ├─ GET  /devices         List devices (Basic Auth)
  ├─ DELETE /devices/:id   Revoke device (Basic Auth)
  ├─ GET  /hello           Connectivity check
  └─ GET  /id              Server unique ID

Cloudflare Workers (stateless routing layer)
  │  KV stores clientId → userName mapping
  │
  └─ UserSyncDO (one instance per user)
       ├─ DO Storage: device info, playlist snapshots, dislike rule snapshots
       └─ WebSocket: real-time multi-device sync
```

**Key dependencies:**

| Dependency | Purpose |
|---|---|
| [Hono](https://hono.dev) | HTTP routing framework |
| [message2call](https://github.com/lyswhut/message2call) | WebSocket RPC |
| [aes-js](https://github.com/ricmoo/aes-js) | AES-128-ECB encryption |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes) | MD5 implementation |

## License

[MIT](LICENSE)

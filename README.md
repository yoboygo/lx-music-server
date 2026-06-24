# lx-music-server

[lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server) 的 Cloudflare Workers 重构版本，使用 Durable Objects 实现有状态的 WebSocket 同步，无需自托管服务器即可运行。

[English](./README.en.md)

## 功能特性

- 基于 Cloudflare Workers + Durable Objects，零服务器运维
- 支持多用户隔离，每个用户拥有独立的 DO 实例和存储
- 实时 WebSocket 双向同步歌单与不喜欢规则
- 快照版本管理，支持多设备增量合并
- 管理面板（`/admin`）：Web UI 管理设备和歌单数据
- 设备管理 API（查看 / 删除已授权设备）
- Cloudflare Git 集成自动部署，无需配置 GitHub Secrets

## 前置要求

- Cloudflare 账号（免费计划即可）
- GitHub 账号（用于 Fork 仓库）

## 部署方式

### 1. 创建 Cloudflare KV Namespace

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages → KV**
3. 点击 **Create a namespace**
4. 输入名称（如 `lx-music-kv`），点击 **Add**
5. 创建完成后，点击进入该 Namespace，在详情页可看到 **Namespace ID**，复制备用

### 2. Fork 并修改 wrangler.toml

1. Fork 本仓库
2. 编辑 `wrangler.toml`，将 KV Namespace ID 填入：

```toml
[[kv_namespaces]]
binding = "KV"
id = "你的_KV_Namespace_ID"  # ← 替换为第 1 步复制的 ID
```

3. 提交并推送到你的 Fork

### 3. 连接 Git 仓库自动部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages → Create**
3. 选择 **Connect to Git**
4. 授权并选择你 Fork 的 `lx-music-server` 仓库
5. 配置构建：
   - **Production branch**: `main`
   - **Build command**: `pnpm deploy`
   - CF 会自动检测 `packageManager` 字段使用 pnpm
6. 点击 **Save and Deploy**

之后每次 push 到 `main` 分支，Cloudflare 会自动监听并重新部署，无需任何 GitHub Secrets。

### 4. 配置用户

在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中配置用户信息：

1. 进入 **Workers & Pages → lx-music-server**
2. 点击 **Settings → Variables and Secrets**
3. 点击 **Add**，类型选择 **Secret**，名称填 `LX_USERS`，值填用户配置（JSON 格式）

```json
[{"name":"admin","password":"your_password"},{"name":"alice","password":"her_password","maxSnapshotNum":30}]
```

**支持的用户选项：**

| 选项 | 类型 | 说明 |
|---|---|---|
| `name` | string | 用户名（必填） |
| `password` | string | 登录密码（必填） |
| `maxSnapshotNum` | number | 最大快照保留数量，默认 20 |
| `list.addMusicLocationType` | `"top"` \| `"bottom"` | 歌曲添加位置，默认 `"bottom"` |

> 添加或修改用户只需在 Cloudflare Dashboard 更新 `LX_USERS` Secret，无需修改代码或重新部署。

## 访问地址

部署成功后，默认使用 Workers 域名访问，也可绑定自定义域名。

### 使用 Workers 默认域名

Worker 的默认访问地址为：

```
https://lx-music-server.<your-subdomain>.workers.dev
```

也可在 Cloudflare Dashboard 的 **Workers & Pages → lx-music-server** 页面查看。

### 使用自定义域名（可选）

1. 将你的域名添加到 Cloudflare（**Websites → Add a site**），并按提示修改域名的 NS 记录指向 Cloudflare
2. 在 Cloudflare Dashboard 进入 **Workers & Pages → lx-music-server**
3. 点击 **Settings → Domains & Routes → Add → Custom Domain**
4. 输入你想使用的子域名（如 `sync.example.com`），点击 **Add domain**
5. Cloudflare 会自动创建 DNS 记录并签发 SSL 证书，等待生效即可

绑定成功后，即可通过 `https://sync.example.com` 访问。

> **注意：** 更换同步服务器前，请务必做好本地数据备份，以防数据丢失。

## 客户端配置

在 LX Music 客户端的同步设置中填写：

- **服务器地址**：`https://<your-worker-name>.<your-subdomain>.workers.dev`（或自定义域名）
- **连接码**：在 `LX_USERS` 中配置的密码（不需要输入用户名，服务端会自动匹配）

> 连接码即密码。服务端收到连接请求后会遍历所有用户，用每个用户的密码尝试解密，解密成功即完成认证。

## 设备 ID 机制

### 认证流程

1. **首次认证**：客户端发送加密消息，服务端遍历 `LX_USERS` 尝试解密。匹配成功后，服务端生成随机 `clientId`（16 字节 base64）和 `key`（16 字节 base64），用 RSA 加密返回给客户端。客户端保存 `clientId` 和 `key` 用于后续连接。

2. **重新认证**：客户端发送已保存的 `clientId`，服务端通过 KV 查找对应的用户名，再从 DO 存储中取出 `key` 解密验证。

3. **同名设备复用**：如果设备名称和类型（手机/桌面）与已存在的设备匹配，服务端会复用已有的 `clientId` 和 `key`，避免重复记录。

### 设备删除

通过管理面板或 API 删除设备时，服务端会：
- 从 KV 中移除 `clientId → userName` 映射
- 从 DO 存储中移除设备信息
- 断开该设备的 WebSocket 连接
- 清除该设备的快照跟踪信息

删除后，设备需要重新认证才能连接。

### 限制

- 每个用户最多 101 个设备
- 同一设备重新安装或清除数据后，会生成新的 `clientId`，旧条目不会自动清理

## 管理面板

访问 `https://<your-worker-url>/admin` 进入管理面板，使用 `LX_USERS` 中配置的用户名和密码登录。

### 功能一览

**设备管理**
- 查看所有已授权设备（设备名称、类型、最后连接时间）
- 单个删除设备，删除后需重新认证

**歌单数据**
- 侧边栏显示所有歌单及歌曲数量（我的收藏、试听列表、自定义歌单）
- 分页浏览歌曲列表（歌曲名、歌手、来源、时长）
- 批量选择并删除歌曲
- 不喜欢规则管理：查看、单条删除、批量删除

**数据备份**
- 导出：将所有歌单和不喜欢规则导出为 JSON 文件（点击顶栏「导出数据」按钮）
- 导入：从 JSON 文件恢复数据，导入前会弹窗确认（点击顶栏「导入数据」按钮）

### 导出文件格式

```json
{
  "listData": {
    "defaultList": [{ "id": "...", "name": "...", "singer": "...", "source": "kw", "interval": "04:32", "meta": "{}" }],
    "loveList": [...],
    "userList": [{ "id": "list_xxx", "name": "我的歌单", "list": [...] }]
  },
  "dislikeRules": "歌曲名@歌手名\n另一首歌@另一个歌手"
}
```

> 导出的 JSON 文件可作为完整备份。导入时会覆盖当前用户的所有歌单和不喜欢规则数据。

### 管理面板 API

所有接口使用 HTTP Basic Auth，用户名和密码与同步账号相同。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/login` | 验证登录凭据 |
| GET | `/api/admin/devices` | 获取已授权设备列表 |
| DELETE | `/api/admin/devices/:clientId` | 删除指定设备 |
| GET | `/api/admin/list-data` | 获取歌单数据 |
| GET | `/api/admin/dislike-data` | 获取不喜欢规则 |
| POST | `/api/admin/list-music/delete` | 批量删除歌曲 `{listId, musicIds}` |
| POST | `/api/admin/dislike-music/delete` | 覆写不喜欢规则 `{rules}` |
| GET | `/api/admin/export` | 导出所有数据（歌单+不喜欢规则） |
| POST | `/api/admin/import` | 导入数据 `{listData, dislikeRules}` |

## 设备管理 API

通过 Basic Auth 访问设备管理接口，用户名和密码与同步账号相同。

**查看已授权设备：**

```bash
curl -u <用户名>:<密码> https://<worker-url>/devices
```

**删除指定设备：**

```bash
curl -u <用户名>:<密码> -X DELETE https://<worker-url>/devices/<clientId>
```

## 本地开发

```bash
pnpm install
pnpm dev
```

> 本地开发使用 `wrangler dev`，Durable Objects 和 KV 均在本地模拟运行。

### 手动部署（可选）

如需在本地部署到 Cloudflare Workers：

```bash
wrangler login    # 首次需要，浏览器弹窗授权
pnpm install
pnpm deploy
```

## 技术架构

```
客户端
  │
  ├─ GET  /ah              认证（新设备 / 重新认证）
  │     ├─ 新设备：生成 clientId + key，RSA 加密返回
  │     └─ 已知设备：通过 clientId 查找 key，解密验证
  ├─ GET  /socket          WebSocket 升级 → UserSyncDO
  │     └─ 通过 KV 查找 clientId → userName，路由到对应 DO
  ├─ GET  /devices         设备列表（Basic Auth）
  ├─ DELETE /devices/:id   删除设备（Basic Auth）
  ├─ GET  /admin           管理面板（Web UI）
  ├─ /api/admin/*          管理面板 API（Basic Auth）
  ├─ GET  /hello           连通性检测
  └─ GET  /id              服务器唯一 ID

Cloudflare Workers（无状态路由层）
  │  KV：clientId → userName 映射（用于 WebSocket 路由）
  │
  └─ UserSyncDO（每用户一个实例）
       ├─ DO Storage
       │    ├─ devicesInfo：设备信息（clientId, key, deviceName, isMobile）
       │    ├─ 歌单快照（MD5 版本化，支持多设备增量合并）
       │    └─ 不喜欢规则快照
       └─ WebSocket：多设备实时同步
```

**主要依赖：**

| 依赖 | 用途 |
|---|---|
| [Hono](https://hono.dev) | HTTP 路由框架 |
| [message2call](https://github.com/lyswhut/message2call) | WebSocket RPC |
| [aes-js](https://github.com/ricmoo/aes-js) | AES-128-ECB 加解密 |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes) | MD5 实现 |

## License

[MIT](LICENSE)

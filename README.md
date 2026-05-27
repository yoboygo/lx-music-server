# lx-music-server

[lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server) 的 Cloudflare Workers 重构版本，使用 Durable Objects 实现有状态的 WebSocket 同步，无需自托管服务器即可运行。

[English](./README.en.md)

## 功能特性

- 基于 Cloudflare Workers + Durable Objects，零服务器运维
- 支持多用户隔离，每个用户拥有独立的 DO 实例和存储
- 实时 WebSocket 双向同步歌单与不喜欢规则
- 快照版本管理，支持多设备增量合并
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
3. 点击 **Add**，类型选择 **Secret**，名称填 `LX_USERS`，值填用户配置

**支持两种格式：**

**简单格式**（用户名:密码，逗号分隔）：

```
admin:your_password,alice:her_password
```

**JSON 格式**（支持更多选项）：

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
- **连接码**：对应的密码

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

## 技术架构

```
客户端
  │
  ├─ GET  /ah          认证（新设备 / 重新认证）
  ├─ GET  /socket      WebSocket 升级 → UserSyncDO
  ├─ GET  /devices     设备列表（Basic Auth）
  ├─ DELETE /devices/:id  删除设备（Basic Auth）
  ├─ GET  /hello       连通性检测
  └─ GET  /id          服务器唯一 ID

Cloudflare Workers（无状态路由层）
  │  使用 KV 存储 clientId → userName 映射
  │
  └─ UserSyncDO（每用户一个实例）
       ├─ DO Storage：设备信息、歌单快照、不喜欢规则快照
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

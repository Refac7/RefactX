# Admin 身份验证配置指南

本文档涵盖 RefactX CMS 管理面板的完整身份验证配置，包括多用户支持、JWT 签发、CAPTCHA 验证和频率限制。

---

## 1. 管理员账号配置

### 1.1 生成密码哈希

使用 `scripts/gen-hash.js` 为每位管理员生成 bcrypt 哈希。脚本会自动将哈希以 **base64** 编码输出，以避免 `.env` 中 `$` 符号被 Vite 的 `dotenv-expand` 当作变量展开。

```sh
# 单用户（默认用户名 admin）
node scripts/gen-hash.js 你的明文密码

# 指定用户名
node scripts/gen-hash.js Refac7 你的明文密码
```

输出示例：

```
Username: Refac7
Original hash: $2b$10$UINwFaBpoh62R5WPfS1L4ul.wM4o0lhvE1rskIGzFhJUS1vB2rCGC
Base64 encoded: JDJiJDEwJFVJTndGYUJwb2g2MlI1V1BmUzFMNHVsLndNNG8wbGh2RTFyc2tJR3pGaEpVUzF2QjJyQ0dD

-- Add to .env as ADMIN_USERS (JSON) --
ADMIN_USERS='{"Refac7":"JDJiJDEwJFVJTndGYUJwb2g2MlI1V1BmUzFMNHVsLndNNG8wbGh2RTFyc2tJR3pGaEpVUzF2QjJyQ0dD"}'

For multiple users, combine into a single JSON object:
ADMIN_USERS='{"user1":"base64hash...","user2":"base64hash..."}'
```

### 1.2 配置管理员用户

在 `.env` 文件中设置 `ADMIN_USERS`（JSON 格式，键为用户名，值为 base64 编码的 bcrypt 哈希）：

```env
# 多用户（推荐）
# 哈希值使用 base64 编码，避免 $ 符号被 dotenv-expand 误处理
ADMIN_USERS='{"Refac7":"JDJiJDEwJFVJTndGYUJwb2g2MlI1V1BmUzFMNHVsLndNNG8wbGh2RTFyc2tJR3pGaEpVUzF2QjJyQ0dD","editor":"base64hash..."}'

# 单用户兼容写法（base64 编码的哈希，等同于 {"admin":"base64hash..."}）
ADMIN_PASSWORD=base64hash...
```

- 用户名**不区分大小写**（后端自动转为小写匹配）
- `ADMIN_USERS` 优先级高于 `ADMIN_PASSWORD`，两者同时存在时忽略 `ADMIN_PASSWORD`
- 哈希值以 base64 编码存储（`gen-hash.js` 自动生成），后端自动解码为原始 bcrypt 哈希
- 同时也兼容直接存储原始 bcrypt 哈希（以 `$2` 开头），但不推荐，因为 `$` 可能被 Vite 的 `dotenv-expand` 误处理

### 1.3 为什么需要 base64 编码？

bcrypt 哈希的格式为 `$2b$10$...`，其中包含多个 `$` 符号。Vite/Astro 在加载 `.env` 时使用 `dotenv-expand` 处理变量值，该库会将 `$VAR_NAME` 模式解释为环境变量引用并展开。例如哈希中的 `$UINwFaBpoh62R5WPfS1L4ul` 被识别为变量名，展开为空字符串，导致哈希损坏。

使用 base64 编码后，存储的值仅包含 `[A-Za-z0-9+/=]`，不包含 `$` 符号，完全避免了此问题。

---

## 2. JWT 密钥配置

用于签发和验证登录会话 Token。

```env
ADMIN_JWT_SECRET=YOUR_ADMIN_JWT_SECRET
```

使用 `openssl rand -hex 32` 生成随机密钥：

```sh
openssl rand -hex 32
```

- Token 有效期：**2 小时**
- Token 中包含 `username`、`ip`、`ts` 字段
- 客户端 Token 存储在 `localStorage` 的 `admin_jwt_token` 键中
- 登出时自动清除

---

## 3. CAPTCHA 验证配置

系统使用 **Proof-of-Work (PoW) 验证码** 替代第三方验证码服务。用户在浏览器中计算 SHA-256 哈希以满足难度要求，无需外部服务依赖。

```env
CAPTCHA_SECRET=YOUR_CAPTCHA_SECRET_KEY
```

同样使用 `openssl rand -hex 32` 生成：

```sh
openssl rand -hex 32
```

CAPTCHA 工作流程：

1. 客户端请求挑战值（随机 UUID）和难度（当前为 4，即哈希结果需以 `0000` 开头）
2. 客户端在浏览器中迭代 nonce 计算 `SHA-256(challenge:nonce)`，直到满足难度
3. 客户端提交 nonce 到服务端验证，换取 HMAC-SHA256 签名的令牌
4. 该令牌有效期 **5 分钟**，用于防重放攻击

---

## 4. 频率限制（Rate Limiting）

防止暴力破解的内置机制，无需额外配置。

| 参数 | 值 | 说明 |
|------|-----|------|
| 最大尝试次数 | 5 次 | 达到后触发锁定 |
| 锁定时间 | 15 分钟 | 锁定期间所有请求返回 429 |
| 记录重置时间 | 1 小时 | 超过后该 IP 记录自动清除 |

- 基于客户端 IP（优先 `x-forwarded-for`，其次 `cf-connecting-ip`）
- **内存存储**，服务重启后所有记录重置
- 密码正确后自动清除该 IP 的失败记录
- 对所有 Admin API 端点生效：`/api/auth`、`/api/batch-commit`、`/api/get-content`、`/api/list-files`、`/api/next-filename`、`/api/captcha`

---

## 5. 完整 .env 配置模板

```env
# --- Notion 集成（可选，用于动态内容同步） ---
NOTION_DATABASE_ID=YOUR_NOTION_DATABASE_ID
NOTION_API_KEY=YOUR_NOTION_API_KEY

# --- Admin 多用户认证 ---
# 使用 node scripts/gen-hash.js <username> <password> 生成 base64 编码的哈希
ADMIN_USERS='{"your-username":"base64-encoded-bcrypt-hash"}'

# --- JWT 签名密钥（openssl rand -hex 32） ---
ADMIN_JWT_SECRET=YOUR_ADMIN_JWT_SECRET

# --- GitHub API Token（用于 CMS 文件管理） ---
GITHUB_TOKEN=YOUR_GITHUB_TOKEN

# --- CAPTCHA 密钥（openssl rand -hex 32） ---
CAPTCHA_SECRET=YOUR_CAPTCHA_SECRET_KEY

# --- 上传 Token（可选） ---
PUBLIC_UPLOAD_TOKEN=YOUR_PUBLIC_UPLOAD_TOKEN
```

---

## 6. 身份验证流程

```
用户输入用户名+密码 → 完成 PoW CAPTCHA
       │
       ▼
POST /api/auth { username, password, captchaToken }
       │
       ├─ 频率限制检查（每个 IP 最多 5 次失败，锁定 15 分钟）
       ├─ CAPTCHA 令牌验证（HMAC-SHA256，5 分钟有效期）
       ├─ 用户名查找（从 ADMIN_USERS 映射表）
       ├─ base64 解码存储的哈希，还原为 bcrypt 哈希
       ├─ bcrypt.compare 密码比对
       │
       ├─ 成功 → 签发 JWT（含 username、ip、ts，有效期 2h）→ 返回 200
       └─ 失败 → 记录失败尝试 → 返回 401
```

所有后续 CMS API 请求均需携带 `Authorization: Bearer <jwt_token>` 请求头，无需重复验证 CAPTCHA。

---

## 7. 安全建议

1. **生产环境务必更换所有默认密钥**，不要使用代码中的硬编码回退值：
   - `ADMIN_JWT_SECRET` 回退值：`default_secret`
   - `CAPTCHA_SECRET` 回退值：`refactx-edge-secret`

2. **定期轮换密钥**：`ADMIN_JWT_SECRET` 和 `CAPTCHA_SECRET` 应定期更换

3. **为每位管理员创建独立账号**：不要共用密码，便于审计和权限收窄

4. **使用强密码**：bcrypt 的 10 轮加盐可抵御彩虹表攻击，但弱密码仍会被暴力破解

5. **频率限制**：当前为内存存储，服务重启后失效。如需持久化，可改为 Redis 或数据库存储

---

## 8. 添加新用户

```sh
# 为新用户生成密码哈希
node scripts/gen-hash.js 新用户名 密码

# 将输出的 base64 哈希添加到 .env 的 ADMIN_USERS JSON 中
# 例如：
ADMIN_USERS='{"Refac7":"JDJiJDEw...","新用户名":"base64hash..."}'
```

重启 `pnpm dev` 后新用户即可登录。

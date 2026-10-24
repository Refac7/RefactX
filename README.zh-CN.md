# RefactX

[English](README.md) | 简体中文

RefactX 是一个使用 **Astro 6**、**React 19**、**Tailwind CSS 4** 与 **TypeScript** 构建的现代化、可配置、可自托管内容平台。项目面向个人开发者、技术写作者与内容型个人网站，提供高信息密度的编辑界面与组件化架构，用于发布长文、维护项目与友链数据，并通过内置 CMS 管理内容。

## 技术栈

- **Astro 6** — 应用框架、路由与静态生成
- **React 19** — 管理后台等交互式组件
- **TypeScript** — 静态类型与接口约束
- **Tailwind CSS 4** — 样式与设计令牌
- **Nano Stores** — 轻量级客户端状态管理
- **Vercel Serverless API** — 身份验证与 CMS 服务端接口
- **Pagefind** — 生产环境站内搜索
- **Waline** — 评论与留言功能
- **Notion API** — 动态内容同步
- **GitHub API（Octokit）** — 仓库化内容读写

## 功能特性

- 基于 Markdown 与类型化内容集合的文章发布
- 文章布局、分页、标签、作者与推荐内容的可配置展示
- 内置 CMS，可创建、编辑、删除仓库中的文章与 JSON 数据
- 友链、项目、关于页等结构化 JSON 内容管理
- 多用户管理后台，使用 bcrypt 密码哈希与 JWT 身份验证
- 通过 GitHub API 直接向仓库提交内容变更
- 基于文章作者的编辑权限校验
- 可配置的站点元信息、导航、社交链接、评论与页面文案
- 亮色/暗色主题、节日主题与可选的节日视觉特效
- GitHub 贡献活跃图展示
- 首页技能墙、构建信息与技术栈展示
- Pagefind 站内搜索（仅生产构建可用）
- RSS、Sitemap、robots.txt 与 SEO 元信息
- 响应式布局，适配桌面端与移动端
- 支持 Vercel 部署

## 环境要求

| 依赖 | 版本要求 |
| --- | --- |
| Node.js | 22.12 或更高版本 |
| pnpm | 7.1 或更高版本 |
| Git | 任意受支持版本 |

> Astro 6 要求 Node.js `>=22.12.0`，低于该版本可能无法正常构建。

## 快速开始

克隆仓库并安装依赖：

```bash
git clone https://github.com/Refac7/RefactX.git
cd RefactX
pnpm install
```

复制环境变量模板并按需填写：

```bash
cp example.env .env
```

启动开发服务器：

```bash
pnpm dev
```

默认访问地址为 `http://localhost:4321`。

构建生产版本：

```bash
pnpm build
```

该命令会依次执行类型检查、Astro 构建，并为 `.vercel/output/static` 生成 Pagefind 搜索索引。

本地预览构建结果：

```bash
pnpm preview
```

## 项目结构

```text
RefactX/
├── src/
│   ├── assets/              # 静态与应用资源
│   ├── components/          # Astro 与 React 组件
│   │   ├── admin/           # CMS 管理后台
│   │   ├── base/            # 通用基础组件（搜索、页头、贡献图等）
│   │   ├── dynamic/         # 动态内容组件
│   │   ├── posts/           # 文章卡片、布局、目录与评论
│   │   ├── projects/        # 项目展示组件
│   │   ├── theme/           # 主题切换
│   │   └── ui/              # 通用 UI（验证码等）
│   ├── content/
│   │   ├── data/            # 结构化 JSON 内容
│   │   └── posts/           # Markdown 文章
│   ├── layouts/             # 页面布局（Header、Footer、Layout）
│   ├── lib/                 # 工具函数、认证、频率限制
│   ├── pages/               # 页面路由与 API 端点
│   │   └── api/             # 服务端接口
│   ├── stores/              # 客户端状态
│   ├── styles/              # 全局样式与排版样式
│   ├── config.ts            # 站点统一配置
│   ├── content.config.ts    # 内容集合 Schema
│   └── types.ts             # 类型定义
├── plugins/                 # Remark / Rehype 扩展
├── scripts/                 # 开发与管理脚本
├── public/                  # 公共静态文件
├── astro.config.mjs         # Astro 配置
├── package.json             # 依赖与脚本
├── tsconfig.json            # TypeScript 配置
└── vercel.json              # 部署与缓存响应头配置
```

## 站点配置

站点的主要配置集中在 `src/config.ts`。该文件控制站点元信息、导航、社交链接、文章展示、标签与作者页、项目展示、动态页、留言板、友链、评论系统、CMS、GitHub 集成以及节日主题。

常见的站点元信息配置如下：

```ts
export const SITE = {
  title: 'RefactX Project',
  description: '你与光芒 / You & Radiance',
  website: 'https://example.com',
  base: '/',
  author: 'Refact',
  ogImage: '/og-image.webp',
  version: '1.9',
  footerText: '页脚文案',
  footerText2: '页脚副文案',
}
```

部署前请检查 `src/config.ts`，将示例值替换为目标站点的实际信息。常用配置项包括：

| 配置项 | 说明 |
| --- | --- |
| `SITE` | 站点标题、描述、域名、作者、OG 图片等 |
| `HEADER_LINKS` / `FOOTER_LINKS` | 顶部与底部导航 |
| `SOCIAL_LINKS` | 社交平台链接与图标 |
| `POSTS_CONFIG` | 文章列表密度、布局、默认封面与按钮文案 |
| `TAGS_CONFIG` / `AUTHORS_CONFIG` | 标签页与作者页文案 |
| `PROJECTS_CONFIG` / `DYNAMIC_CONFIG` | 项目页与动态页文案 |
| `FRIENDS_CONFIG` / `FRIENDS_CONTACT` | 友链页与站长名片 |
| `WALINE_CONFIG` | 评论服务地址、验证码与图片上传 |
| `CMS_CONFIG` | CMS 开关、GitHub 仓库、分支与路径前缀 |
| `HOLIDAY_THEMES` / `HOLIDAY_EFFECTS` | 节日主题日期与视觉特效 |
| `PAGE_LOADER_CONFIG` | 页面切换加载动画 |

## 内容管理

### 文章

文章以 Markdown 文件形式存放于 `src/content/posts/`，每篇文章通过 YAML Frontmatter 定义元数据：

```yaml
---
title: 文章标题
description: 文章的简短摘要。
pubDate: 2026-01-01
updatedDate: 2026-01-02
author: 作者名
tags:
  - Astro
  - TypeScript
heroImage: cover.webp
heroImageLayout: right
heroImageAspectRatio: '16/9'
recommend: true
postType: jap
contentWarning: 内容提示
---
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `description` | 是 | 文章摘要，用于列表与 SEO |
| `pubDate` | 是 | 发布日期 |
| `updatedDate` | 否 | 更新日期 |
| `author` | 否 | 作者，默认取 `POSTS_CONFIG.author` |
| `tags` | 是 | 标签数组 |
| `heroImage` | 否 | 封面图。本地文件名会自动映射到 `/hero-images/`；也可填完整 URL，或使用 `none` 禁用 |
| `ogImage` | 否 | OG 图片。本地文件名会自动映射到 `/og-images/`；也可填完整 URL，或使用 `none` |
| `heroImageLayout` | 否 | 封面布局，例如 `right` |
| `heroImageAspectRatio` | 否 | 封面宽高比，默认 `16/9` |
| `recommend` | 否 | 是否作为推荐文章展示，默认 `false` |
| `postType` | 否 | 文章布局类型，例如 `jap` |
| `contentWarning` | 否 | 内容警告提示 |

以 `_` 开头的 Markdown 文件不会被内容集合加载，可用于存放草稿或片段。

### Markdown 扩展

渲染管线位于 `plugins/`，支持：

- 阅读时长统计与低质量图片占位图（LQIP）
- 自定义指令：徽章、带 favicon 的链接、Bilibili 嵌入等
- 数学公式（`remark-math` + `rehype-katex`）
- Callout 提示块（`rehype-callouts`）
- 标题锚点、外链处理、图片解包与表格包装
- Expressive Code 代码块，支持折叠区段与行号

### 结构化数据

非文章内容以 JSON 形式存放于 `src/content/data/`。其中 `friends` 与 `projects` 通过自定义加载器注册为 Astro 内容集合，`about.json` 则由关于页直接导入：

- `friends.json` — 友链数据
- `projects.json` — 项目数据
- `about.json` — 关于页内容

结构化数据不按文章处理，因此不需要 `author`、`pubDate` 等文章字段。

友链条目示例：

```json
{
  "name": "站点名称",
  "author": "站长昵称",
  "url": "https://example.com",
  "avatar": "https://example.com/avatar.png",
  "description": "一句话简介"
}
```

项目条目示例：

```json
{
  "name": "Project Name",
  "description": "项目简介",
  "githubUrl": "https://github.com/user/repository",
  "website": "https://example.com",
  "type": "icon",
  "icon": "icon-[mdi--github]",
  "star": 0,
  "fork": 0
}
```

## 页面路由

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：导航卡片、最新文章、贡献图、技能墙与构建信息 |
| `/posts` | 分页文章列表 |
| `/posts/[slug]` | 文章详情 |
| `/tags` | 标签总览 |
| `/tags/[tag]` | 按标签筛选的文章列表 |
| `/authors` | 作者总览 |
| `/authors/[author]` | 指定作者的文章列表 |
| `/projects` | 项目展示 |
| `/dynamic` | Notion 动态流（带验证码校验） |
| `/messageboard` | 留言板 |
| `/friends` | 友链 |
| `/about` | 关于页 |
| `/admin` | CMS 管理后台 |
| `/api/auth` | 登录与 JWT 签发 |
| `/api/captcha` | PoW 验证码挑战与校验 |
| `/api/dynamic` | Notion 动态代理 |
| `/api/get-content`、`/api/list-files`、`/api/batch-commit`、`/api/next-filename`、`/api/repo-stats` | CMS 仓库操作接口 |
| `/rss.xml` | RSS 订阅 |
| `/404` | 404 页面 |

服务端接口需设置 `export const prerender = false`，以 Vercel Serverless Function 形式运行。

## CMS 管理后台

CMS 通过 `CMS_CONFIG` 配置，默认使用 GitHub 仓库作为内容存储。后台支持多管理员账号，账号信息通过 `ADMIN_USERS` 环境变量提供。

生成密码哈希：

```bash
# 默认用户名为 admin
node scripts/gen-hash.js <password>

# 指定用户名
node scripts/gen-hash.js <username> <password>
```

将输出结果写入 `.env`：

```env
ADMIN_USERS='{"username":"bcrypt-hash"}'
ADMIN_JWT_SECRET=<secure-random-secret>
CAPTCHA_SECRET=<secure-random-secret>
```

CMS 发布内容还需要 GitHub 访问令牌：

```env
GITHUB_TOKEN=<github-personal-access-token>
```

该令牌需要具备修改 `CMS_CONFIG` 中所配置仓库与分支的权限。哈希也可使用 base64 形式存储，以避免 dotenv 对 `$` 的变量展开；服务端会自动识别。

认证流程概要：

1. 用户输入用户名与密码。
2. 客户端完成 PoW 验证码（SHA-256 难度校验）。
3. 服务端校验验证码令牌、用户名与 bcrypt 密码哈希。
4. 登录成功后签发有效期 2 小时的 JWT，后续 CMS 请求通过 `Authorization: Bearer <token>` 访问。
5. 登录失败会触发频率限制（默认 5 次失败后锁定 15 分钟）。

更完整的认证、验证码与频率限制说明请参阅 [`scripts/README.md`](scripts/README.md)。

## 环境变量

将 `example.env` 复制为 `.env` 后填写实际值。

| 变量 | 何时需要 | 用途 |
| --- | --- | --- |
| `ADMIN_USERS` | 启用 CMS | 管理员账号与 bcrypt 密码哈希（JSON） |
| `ADMIN_JWT_SECRET` | 启用 CMS | JWT 签名密钥 |
| `CAPTCHA_SECRET` | 启用验证码 | 验证码 HMAC 签名密钥 |
| `GITHUB_TOKEN` | 启用 CMS 发布 | GitHub 仓库读写权限 |
| `NOTION_API_KEY` | 启用动态页 | Notion API 密钥 |
| `NOTION_DATABASE_ID` | 启用动态页 | Notion 数据库 ID |
| `PUBLIC_WALINE_SERVER_URL` | 启用评论 | Waline 服务端地址 |
| `PUBLIC_UPLOAD_TOKEN` | 启用图片上传 | 上传服务凭据 |
| `PUBLIC_IMG_BED_URL` | 启用图片上传 | 图床接口地址 |

`PUBLIC_` 前缀变量会暴露到客户端，请勿将私密凭据放入其中。

生成随机密钥：

```bash
openssl rand -hex 32
```

请勿将生产环境的凭据、访问令牌或签名密钥提交到仓库。

## 部署

RefactX 默认使用 `@astrojs/vercel` 适配器，可部署到 Vercel，也可部署到其他能够运行 Astro 静态站点与 Serverless API 的环境。

### Vercel

1. Fork 或克隆本仓库。
2. 在 Vercel 中导入项目。
3. 配置上述环境变量。
4. 检查 `src/config.ts` 与 `CMS_CONFIG`、站点域名等设置。
5. 部署项目。

构建命令使用 `pnpm build`。构建完成后，静态资源位于 `.vercel/output/static`，并会在构建末尾生成 Pagefind 索引。

`vercel.json` 中已配置基础安全响应头与缓存策略：

- `/_astro/*` 与 `/fonts/*` 使用一年期不可变缓存
- `/pagefind/*` 使用 1 小时缓存并支持 `stale-while-revalidate`

## 评论与外部服务

评论功能通过 `WALINE_CONFIG` 配置，可在文章页与留言板中使用。图片上传、Notion 动态同步等集成通过公开环境变量与站点配置启用。

外部服务属于部署依赖，其可用性、安全性与运维配置由站点运营者负责。部署到生产环境前，请确认：

- Waline 服务端已正确部署并配置数据库
- Notion 集成已获得目标数据库的访问权限
- 图床上传令牌与接口地址有效
- GitHub Token 权限范围尽可能最小化

## 主题与节日特效

RefactX 支持全站亮色/暗色主题，并可通过 `HOLIDAY_THEMES` 按日期启用节日主题（如新年、春节、端午、中秋、国庆与纪念日），通过 `HOLIDAY_EFFECTS` 控制节日视觉特效。

页面切换加载动画由 `PAGE_LOADER_CONFIG` 控制，可随时关闭以保持更简洁的浏览体验。

主题相关样式位于 `src/styles/global.css`，节日组件位于 `src/components/base/HolidayTheme.astro`。

## 开发说明

提交变更前请确保项目可以正常构建：

```bash
pnpm build
```

其他常用命令：

```bash
pnpm dev           # 启动开发服务器
pnpm format        # 使用 Prettier 检查格式
pnpm format:write  # 自动修复格式
```

开发时请注意：

- 保持现有 TypeScript 类型、内容 Schema、认证边界与 CMS 行为不变。
- 区分文章与结构化数据，不要将文章字段校验应用到 JSON 数据条目。
- Pagefind 搜索仅在 `import.meta.env.PROD` 下加载，开发模式不可用。
- 交互式 React 组件作为 Astro Islands 使用，按需选择 `client:load`、`client:visible` 等指令。
- 依赖 `is:inline` 的内联脚本（如主题初始化）会在打包前直接输出，修改时需留意执行时机。
- 内容集合使用 Astro 新版 loader 机制，而非旧版 `src/content/config.ts` 写法。

## 贡献

欢迎通过 Issue 与 Pull Request 参与贡献。请保持变更聚焦，对影响配置或部署的行为补充说明，并在提交前验证生产构建。

对于较大的改动，建议先创建 Issue 讨论方案，再进入实现阶段。

## 许可证

本项目基于 MIT License 分发，详情请参阅仓库中的 [`LICENSE`](LICENSE) 文件。

## 免责声明

RefactX 按“原样”提供，不附带任何明示或暗示的担保。仓库维护者没有义务持续提供维护、支持或兼容性更新。

站点运营者在将项目用于生产环境前，应自行审查配置、凭据、第三方集成与部署安全性。

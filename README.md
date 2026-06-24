# RefactX — 使用手册

> 适用于 Astro v6 · React v19 · Tailwind CSS v4 · TypeScript

![License](https://img.shields.io/github/license/Refac7/RefactX?color=blue&style=flat-square)
![Astro](https://img.shields.io/badge/Astro-v6.0-orange?style=flat-square&logo=astro)
![React](https://img.shields.io/badge/React-v19.0-blue?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4.0-38b2ac?style=flat-square&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-blue?style=flat-square&logo=typescript)

RefactX 是一款面向内容创作者与开发者的现代博客主题。设计语言以「系统终端」为隐喻：玻璃态面板、等宽标签、编号徽章、模糊光晕——在视觉精致与信息密度之间取平衡。

> [!WARNING]
> 本项目按 MIT 许可证分发，不提供任何明示或默示的担保。部署前请修改 `src/config.ts` 中的站点配置，不得直接用于生产环境。

---

## 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [配置手册](#配置手册)
- [内容创作](#内容创作)
- [部署指南](#部署指南)
- [CMS 管理面板](#cms-管理面板)
- [API 参考](#api-参考)
- [主题与节日](#主题与节日)
- [技术架构](#技术架构)
- [致谢与许可](#致谢与许可)

---

## 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| pnpm | ≥ 8 |
| Git | 任意 |

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Refac7/RefactX.git
cd RefactX

# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:4321）
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview
```

### 管理面板密码

```bash
# 生成 bcrypt 哈希
node scripts/gen-hash.js "your-password"
```

将输出的哈希值写入 Vercel 环境变量 `ADMIN_PASSWORD`。

---

## 项目结构

```
RefactX/
├── src/
│   ├── assets/              # 静态资源（封面图等）
│   ├── components/
│   │   ├── admin/           # CMS 管理面板（React）
│   │   ├── base/            # 通用组件
│   │   │   └── PageAside.astro  # 统一侧边栏模板
│   │   ├── dynamic/         # 动态流组件
│   │   ├── posts/           # 文章相关组件
│   │   │   ├── base/        #   基础：Prose / PostTag / PostNavigation / Comments
│   │   │   ├── card/        #   卡片：Card / List
│   │   │   ├── layouts/     #   布局：Jap
│   │   │   └── toc/         #   目录：TableOfContents / TocMobile
│   │   ├── projects/        # 项目展示组件
│   │   ├── theme/           # 主题切换组件
│   │   └── ui/              # 通用 UI（Captcha）
│   ├── content/
│   │   ├── data/            # JSON 数据源（friends.json / projects.json）
│   │   └── posts/           # Markdown 文章
│   ├── layouts/             # 页面布局（Layout / Header / Footer）
│   ├── lib/                 # 工具函数与设计常量
│   ├── pages/               # 路由页面
│   │   ├── api/             #   SSR API 端点
│   │   ├── admin.astro      #   CMS 入口
│   │   ├── index.astro      #   首页
│   │   ├── about.astro      #   关于页
│   │   ├── friends.astro    #   友链页
│   │   ├── 404.astro        #   错误页
│   │   ├── dynamic/         #   动态流页
│   │   ├── posts/           #   文章列表 / 文章详情
│   │   ├── projects/        #   项目展示页
│   │   └── tags/            #   标签索引 / 标签筛选
│   ├── stores/              # 客户端状态（nanostores）
│   └── styles/              # 全局样式
│       ├── global.css       #   Tailwind v4 + 主题变量 + 动画
│       └── pro.css          #   文章排版样式
├── plugins/                 # Remark / Rehype 插件
├── scripts/                 # 工具脚本
├── public/                  # 公共静态资源
│   ├── fonts/               #   自托管字体
│   └── favicon/             #   网站图标
├── astro.config.mjs         # Astro 配置
├── vercel.json              # Vercel 部署配置
├── package.json             # 依赖与脚本
└── tsconfig.json            # TypeScript 配置
```

---

## 配置手册

所有站点配置集中在 `src/config.ts`，以下是完整配置项说明。

### 站点元数据 `SITE`

```ts
export const SITE: Site = {
  title: 'RefactX Project',       // 站点名称
  description: '...',             // 站点描述（SEO）
  website: 'https://www.refact.cc/', // 站点 URL
  author: 'Refact',               // 作者名
  ogImage: '/og-image.webp',      // Open Graph 默认图片
  version: '1.8',                 // 版本号（显示在侧边栏）
  footerText: '...',              // 页脚文案第一行
  footerText2: '...',             // 页脚文案第二行
}
```

### 导航菜单

```ts
// 顶部导航（Header）
export const HEADER_LINKS: Link[] = [
  { name: '文章', url: '/posts' },
  { name: '动态', url: '/dynamic' },
  { name: '项目', url: '/projects' },
  { name: '关于', url: '/about' },
]

// 底部导航（Footer）
export const FOOTER_LINKS: Link[] = [ ... ]

// 侧边栏社交链接（图标来自 Iconify）
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/Refac7',
    icon: 'icon-[ri--arrow-left-up-line]',
  },
]
```

### 文章配置 `POSTS_CONFIG`

```ts
export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Refact 的文章',
  introduce: '...',               // 文章列表页简介
  author: 'Refact',

  // 首页文章卡片
  homePageConfig: {
    size: 3,                      // 显示数量
    type: 'compact',              // 卡片样式：compact | image | time-line
  },

  // 文章列表页
  postPageConfig: {
    size: 8,
    type: 'image',
  },

  // 标签筛选页
  tagsPageConfig: {
    size: 5,
    type: 'time-line',
  },

  defaultHeroImage: '/og-image.webp',
  postType: 'jap',                // 文章布局：jap
  imageDarkenInDark: true,        // 暗色模式下图片加深
}
```

### 技能展示矩阵 `SKILLSSHOWCASE_CONFIG`

```ts
export const SKILLSSHOWCASE_CONFIG = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    {
      direction: 'left',          // 滚动方向：left | right
      skills: [
        { name: 'JavaScript', icon: 'icon-[mdi--language-javascript]' },
      ],
    },
  ],
}
```

### GitHub 贡献图 `GITHUB_CONFIG`

```ts
export const GITHUB_CONFIG = {
  ENABLED: true,
  GITHUB_USERNAME: 'Refac7',
  TOOLTIP_ENABLED: true,
}
```

### 关于页 `ABOUT_CONFIG`

`ABOUT_CONFIG` 包含个人档案、物理属性、技能矩阵、硬件清单、游戏日志、课程表和待办清单。所有字段均为可选，按需填写即可。

### 友链配置 `FRIENDS_CONFIG` / `FRIENDS_CONTACT`

```ts
export const FRIENDS_CONFIG = {
  title: 'Friends',
  description: '...',
  introduce: '...',
  enableAdd: false,               // 是否开放友链申请通道
}

// 你的站点信息（供他人交换友链时复制）
export const FRIENDS_CONTACT = {
  sitename: 'RefactX Project',
  email: 'i@refact.cc',
  author: 'Refac7',
  sitelink: 'https://www.refact.cc',
  siteavatar: 'https://img.refact.cc/base/avatar.jpg',
  description: '...',
}
```

### 评论系统 `WALINE_CONFIG`

```ts
export const WALINE_CONFIG = {
  enableComment: true,
  serverURL: import.meta.env.PUBLIC_WALINE_SERVER_URL,
  uploadToken: import.meta.env.PUBLIC_UPLOAD_TOKEN,
  imgbedURL: import.meta.env.PUBLIC_IMG_BED_URL,
  enableImgUpload: true,
}
```

### CMS 配置 `CMS_CONFIG`

```ts
export const CMS_CONFIG = {
  enableCMS: true,
  owner: 'Refac7',
  repo: 'RefactX',
  branch: 'main',
  pathPrefix: 'src/content/posts/',
}
```

### 节日特效 `HOLIDAY_EFFECTS` / `HOLIDAY_THEMES`

```ts
export const HOLIDAY_EFFECTS = {
  enableHolidayEffects: true,
}

// 按日期配置主题切换
export const HOLIDAY_THEMES = {
  '2026-01-01': {
    theme: 'theme-red',
    message: '新年快乐，全站已切换至节日主题。',
  },
  '2026-06-19': {
    theme: 'theme-green',
    message: '端午安康，全站已切换至粽叶绿主题。',
  },
  // theme-red | theme-green | theme-gold | theme-mourning
}
```

---

## 内容创作

### 编写文章

文章以 Markdown 格式存放在 `src/content/posts/`。每篇文章需包含 YAML frontmatter：

```yaml
---
title: 文章标题
description: 文章摘要
pubDate: 2026-06-24
updatedDate: 2026-06-25    # 可选
tags: [笔记, Astro]          # 可选
heroImage: /path/to/image   # 设为 "none" 隐藏头图
heroImageLayout: right      # right | left
recommend: true              # 可选，标记为推荐
postType: jap                # 可选，文章布局
---
```

### 管理友链

友链数据存储在 `src/content/data/friends.json`：

```json
[
  {
    "name": "站点名称",
    "url": "https://example.com",
    "author": "作者",
    "description": "站点描述",
    "avatar": "https://example.com/avatar.jpg"
  }
]
```

### 管理项目

项目数据存储在 `src/content/data/projects.json`：

```json
[
  {
    "name": "项目名称",
    "description": "项目描述",
    "githubUrl": "https://github.com/user/repo",
    "website": "https://example.com",
    "type": "icon",
    "icon": "icon-[mdi--github]"
  }
]
```

`type` 字段：`"icon"` 使用 Iconify 图标，`"image"` 使用自定义图片作为图标。

---

## 部署指南

### Vercel（推荐）

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `ADMIN_PASSWORD` | CMS 使用时 | bcrypt 哈希密码 |
| `GITHUB_TOKEN` | CMS 使用时 | GitHub Personal Access Token |
| `PUBLIC_WALINE_SERVER_URL` | 评论使用时 | Waline 服务端地址 |
| `PUBLIC_UPLOAD_TOKEN` | 图片上传时 | 图床上传凭证 |
| `PUBLIC_IMG_BED_URL` | 图片上传时 | 图床地址 |
| `NOTION_API_KEY` | 动态流使用时 | Notion API 密钥 |
| `NOTION_DATABASE_ID` | 动态流使用时 | Notion 数据库 ID |

4. 部署。构建命令和输出目录已预配置。

### 环境变量前缀说明

- `PUBLIC_*` — 客户端可访问，用于 Waline 等前端服务
- 无前缀 — 服务端专用，用于 CMS API、Notion 代理等

---

## CMS 管理面板

访问 `/admin` 进入管理面板。首次使用需配置：

1. **生成密码哈希**：`node scripts/gen-hash.js "your-password"`
2. **设置环境变量**：将哈希写入 `ADMIN_PASSWORD`
3. **配置 GitHub Token**：在 GitHub Settings → Developer settings → Personal access tokens 中生成，写入 `GITHUB_TOKEN`（需要 repo 权限）

### 功能概览

| 面板 | 功能 |
|------|------|
| **Content（FS）** | 浏览文章与配置数据，点击加载到编辑器 |
| **Editor** | Markdown 编辑器，支持预览、元数据编辑、保存到队列 |
| **Changes Queue（Q）** | 暂存所有修改，统一提交到 GitHub |

### 安全机制

- bcrypt 密码验证 + PoW CAPTCHA 人机验证
- 登录频率限制（可配置）
- CAPTCHA 令牌 5 分钟过期 + 24 小时验证有效期

---

## API 参考

| 端点 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth` | POST | 密码验证 | 密码 + CAPTCHA |
| `/api/dynamic` | GET | 获取 Notion 动态流 | CAPTCHA 验证状态 |
| `/api/repo-stats` | GET | 获取仓库文件统计 | GitHub Token |
| `/api/batch-commit` | POST | 批量提交更改 | GitHub Token |
| `/api/get-content` | GET | 读取文件内容 | GitHub Token |
| `/api/list-files` | GET | 列出仓库文件 | GitHub Token |
| `/api/next-filename` | GET | 生成下一篇文件名 | GitHub Token |
| `/api/captcha` | POST | PoW 质询/验证 | 无 |

---

## 主题与节日

### 内置节日主题

| 主题类 | 触发日期 | 视觉效果 |
|--------|----------|----------|
| `theme-red` | 元旦、春节、国庆 | 红色主色调 |
| `theme-green` | 端午 | 绿色主色调 |
| `theme-gold` | 中秋 | 金色主色调 |
| `theme-mourning` | 清明、公祭日 | 全站灰度 |

### 添加自定义主题

1. 在 `src/styles/global.css` 的 `@layer base` 中定义 CSS 变量覆盖（参考现有 `theme-red` 等）
2. 在 `src/config.ts` 的 `HOLIDAY_THEMES` 中添加日期配置

```css
html.theme-custom {
  --primary: 280 70% 45%;
  --primary-foreground: 0 0% 100%;
  --accent: 280 60% 95%;
  /* ... 其他变量 */
}
```

---

## 技术架构

### 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Astro v6（静态输出 + SSR 端点） |
| UI | React v19（交互岛屿） |
| 样式 | Tailwind CSS v4 + `@tailwindcss/typography` |
| 图标 | `@iconify/tailwind4`（Phosphor 图标集） |
| 状态管理 | nanostores（主题切换） |
| 内容 | Markdown + YAML frontmatter（Astro Content Collections） |
| 搜索 | Pagefind（构建时索引） |
| 评论 | Waline |
| 数学 | KaTeX（remark-math + rehype-katex） |
| 部署 | Vercel（Serverless Functions） |

### 路径别名

`~/` 映射到 `src/`，在 `.astro`、`.tsx`、`.ts` 文件中均可使用。

### 代码规范

- Prettier 格式化（140 字符行宽，无分号，单引号）
- `pnpm format` 检查格式，`pnpm format:write` 自动修复
- TypeScript 严格模式

---

## 致谢与许可

本项目基于 [Litos theme](https://github.com/Dnzzk2/Litos)（MIT 许可证）重构。

由 Refac7 维护，沿用 MIT 许可证。

> [!NOTE]
> 开发者对开源项目无必须的维护义务。欢迎提交 Issue 与 Pull Request，但请理解响应时间可能较长。

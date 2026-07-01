# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RefactX is a personal blog/portfolio built with **Astro v6** (static output), **React v19** (interactive islands), **Tailwind CSS v4**, and **TypeScript**. It deploys to **Vercel** and uses **pnpm** for package management. Content is stored as markdown files in `src/content/posts/` and JSON in `src/content/data/`.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Type-check (astro check) → build → pagefind search index
pnpm preview          # Preview built output
pnpm format           # Check formatting with Prettier
pnpm format:write     # Auto-fix formatting
```

Generate a bcrypt password hash for the admin panel:
```bash
node scripts/gen-hash.js "your-password"
```

## Architecture

### Central Configuration (`src/config.ts`)
All site-wide configuration lives here — site metadata, navigation links, post/page/project settings, holiday theme dates, Waline comments, CMS GitHub integration, and about-page content. Import from `~/config` path alias.

### Content Collections (`src/content.config.ts`)
Three collections: **posts** (markdown via glob loader from `src/content/posts/`), **friends** (JSON from `src/content/data/friends.json`), **projects** (JSON from `src/content/data/projects.json`). A custom `createJsonLoader` function wraps JSON files as Astro content collections so they work with `getCollection()`.

### Routing (Astro Pages in `src/pages/`)
- `/` — Homepage with nav cards, recent posts, GitHub contribution graph, skills showcase
- `/posts/[...page]` — Paginated post list
- `/posts/[...slug]` — Individual post (renders markdown via content collection, supports layout variants like `jap`)
- `/tags/[tag]/[...page]` — Tag-filtered post lists
- `/projects/` — Project showcase
- `/dynamic/` — Notion-synced dynamic feed (behind CAPTCHA verification)
- `/about/`, `/friends/` — Static pages
- `/admin/` — React CMS admin panel
- `/api/auth` — bcrypt password auth with rate limiting and CAPTCHA verification (SSR, `prerender = false`)
- `/api/dynamic` — Notion API proxy for the dynamic feed (SSR)
- `/api/repo-stats`, `/api/batch-commit`, `/api/get-content`, `/api/list-files`, `/api/next-filename` — CMS backend endpoints
- `/rss.xml` — RSS feed generation

### Component Organization (`src/components/`)
- **`base/`** — Reusable Astro/React components: `Head.astro` (meta tags, SEO, theme init inline script), `HeaderLink.astro`, `FooterLink.astro`, `Pagination.astro`, `HolidayTheme.astro`, `GithubContributions.tsx`, `Tooltip.tsx`, `ZoomImage.astro`, `SkillsShowcase.astro`
- **`posts/`** — Post-specific components: cards (`Card.astro`, `List.astro`), layouts (`Jap.astro`), TOC (`TableOfContents.astro`, `TocMobile.astro`, `SimpleProgressRing.astro`), comments (`Comments.astro`), navigation
- **`admin/`** — Full React CMS with context-based state management: auth, editor, file system hooks, panels for data/editor/json editing
- **`dynamic/`** — `DynamicFeed.tsx`: Notion-backed feed with CAPTCHA gating and client-side caching
- **`theme/`** — `ThemeToggle.tsx`: dark/light/system mode switch using nanostores
- **`ui/`** — `Captcha.tsx`: HMAC-based CAPTCHA widget
- **`projects/`** — `ProjectStats.tsx`: GitHub star/fork counts

### Layouts (`src/layouts/`)
`Layout.astro` is the root wrapper (imports global CSS, renders Head/Header/Footer/HolidayTheme). `Header.astro` and `Footer.astro` use navigation config from `config.ts`.

### Client-Side State (`src/stores/`)
Uses **nanostores** for lightweight reactivity. Currently `themeStore` (atom: `'light' | 'dark' | 'system'`).

### Markdown Pipeline (`plugins/`)
Custom remark plugins: `remark-reading-time.ts`, `remark-lqip.js` (low-quality image placeholders). Configured in `plugins/index.ts` which exports `remarkPlugins` and `rehypePlugins` arrays consumed by `astro.config.mjs`. Also includes `remark-directive-sugar` for custom directives (badges, links with favicons, bilibili embeds), `remark-math` + `rehype-katex` for math, and `rehype-callouts` for callout blocks.

### Styles (`src/styles/`)
- `global.css` — Tailwind v4 with `@tailwindcss/typography`, theme variables, holiday themes
- `pro.css` — Extended prose/typography styles for post content

### API Layer Notes
- SSR endpoints must set `export const prerender = false`
- Rate limiting (`src/lib/rateLimit.ts`) uses in-memory Map with configurable max attempts and lock time
- Auth uses bcryptjs with CAPTCHA (HMAC-SHA256 with timestamp validation, 5-min expiry)
- CMS interacts with GitHub API for content management (Octokit), requires `GITHUB_TOKEN` env var
- Dynamic feed uses Notion API, requires `NOTION_API_KEY` and `NOTION_DATABASE_ID` env vars

### Build Details
- Static output with Vercel adapter
- pagefind runs post-build for client-side search (`--site .vercel/output/static`)
- Vendor chunk splitting: react-vendor, framer-vendor, utils
- Terser minification with comments stripped
- `vercel.json` sets cache headers: immutable for `/_astro/*` and `/fonts/*`, 1-hour + stale-while-revalidate for `/pagefind/*`

### Path Alias
`~/` maps to `src/` (configured in `tsconfig.json`).

## Important Patterns

- **React components** are interactive islands — use `client:visible`, `client:load` etc. Astro components (`.astro`) are server-rendered with inline scripts for interactivity.
- **Inline scripts** in `.astro` files use `is:inline` to avoid Astro bundling. Theme initialization and holiday logic rely on this to execute before paint.
- **Astro lifecycle events**: components listen to `astro:after-swap` and `astro:before-swap` for SPA navigation state management.
- **Content config** uses Astro's newer loader-based collections (not the legacy `src/content/config.ts` with `z.defineCollection`).
- **Formatters**: Prettier with `prettier-plugin-astro`, 140 char print width, no semicolons, single quotes.

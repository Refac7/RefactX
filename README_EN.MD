# RefactX — User Manual

> Astro v6 · React v19 · Tailwind CSS v4 · TypeScript

![License](https://img.shields.io/github/license/Refac7/RefactX?color=blue&style=flat-square)
![Astro](https://img.shields.io/badge/Astro-v6.0-orange?style=flat-square&logo=astro)
![React](https://img.shields.io/badge/React-v19.0-blue?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4.0-38b2ac?style=flat-square&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-blue?style=flat-square&logo=typescript)

RefactX is a modern blog theme for content creators and developers. Its design language draws from system-terminal aesthetics: glass-morphism panels, monospace labels, numbered badges, and ambient blur orbs — balancing visual polish with information density.

> [!WARNING]
> This project is distributed under the MIT License without any express or implied warranty. You **must** modify `src/config.ts` before deployment. Do not use directly in production.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration Manual](#configuration-manual)
- [Content Authoring](#content-authoring)
- [Deployment Guide](#deployment-guide)
- [CMS Admin Panel](#cms-admin-panel)
- [API Reference](#api-reference)
- [Themes & Holidays](#themes--holidays)
- [Technical Architecture](#technical-architecture)
- [Credits & License](#credits--license)

---

## Quick Start

### Requirements

| Dependency | Version |
|------------|---------|
| Node.js | ≥ 18 |
| pnpm | ≥ 8 |
| Git | Any |

### Setup

```bash
# Clone the repository
git clone https://github.com/Refac7/RefactX.git
cd RefactX

# Install dependencies
pnpm install

# Start dev server (default http://localhost:4321)
pnpm dev

# Production build
pnpm build

# Preview built output
pnpm preview
```

### Admin Login Setup

```bash
# Generate a password hash for a specific user
node scripts/gen-hash.js <username> <password>

# Example: generate hash for user Refac7
node scripts/gen-hash.js Refac7 "your-password"
```

The script outputs an `ADMIN_USERS` JSON string. Set the following Vercel environment variables:

```env
ADMIN_USERS='{"Refac7":"base64-encoded-bcrypt-hash"}'
ADMIN_JWT_SECRET=<random key from: openssl rand -hex 32>
CAPTCHA_SECRET=<random key from: openssl rand -hex 32>
```

> See [`scripts/README.md`](scripts/README.md) for detailed configuration.

---

## Project Structure

```
RefactX/
├── src/
│   ├── assets/              # Static assets (cover images, etc.)
│   ├── components/
│   │   ├── admin/           # CMS admin panel (React)
│   │   ├── base/            # Shared components
│   │   │   └── PageAside.astro  # Unified sidebar template
│   │   ├── dynamic/         # Dynamic feed components
│   │   ├── posts/           # Post-related components
│   │   │   ├── base/        #   Core: Prose / PostTag / PostNavigation / Comments
│   │   │   ├── card/        #   Cards: Card / List
│   │   │   ├── layouts/     #   Layouts: Jap
│   │   │   └── toc/         #   TOC: TableOfContents / TocMobile
│   │   ├── projects/        # Project showcase components
│   │   ├── theme/           # Theme toggle component
│   │   └── ui/              # Shared UI (Captcha)
│   ├── content/
│   │   ├── data/            # JSON data sources (friends.json / projects.json)
│   │   └── posts/           # Markdown posts
│   ├── layouts/             # Page layouts (Layout / Header / Footer)
│   ├── lib/                 # Utilities & design constants
│   │   └── adminAuth.ts      #   JWT auth & author permission checks
│   ├── pages/               # Route pages
│   │   ├── api/             #   SSR API endpoints
│   │   ├── admin.astro      #   CMS entry
│   │   ├── index.astro      #   Homepage
│   │   ├── about.astro      #   About page
│   │   ├── friends.astro    #   Friends page
│   │   ├── 404.astro        #   Error page
│   │   ├── authors/         #   Author index / author post list
│   │   ├── dynamic/         #   Dynamic feed
│   │   ├── posts/           #   Post list / Post detail
│   │   ├── projects/        #   Project showcase
│   │   └── tags/            #   Tag index / Tag filter
│   ├── stores/              # Client-side state (nanostores)
│   └── styles/              # Global styles
│       ├── global.css       #   Tailwind v4 + theme variables + animations
│       └── pro.css          #   Prose/content typography
├── plugins/                 # Remark / Rehype plugins
├── scripts/                 # Utility scripts
├── public/                  # Public static assets
│   ├── fonts/               #   Self-hosted fonts
│   └── favicon/             #   Favicon assets
├── astro.config.mjs         # Astro configuration
├── vercel.json              # Vercel deployment config
├── package.json             # Dependencies & scripts
└── tsconfig.json            # TypeScript configuration
```

---

## Configuration Manual

All site configuration lives in `src/config.ts`. Below is the complete reference.

### Site Metadata `SITE`

```ts
export const SITE: Site = {
  title: 'RefactX Project',          // Site name
  description: '...',                // Site description (SEO)
  website: 'https://www.refact.cc/', // Canonical URL
  author: 'Refact',                  // Author name
  ogImage: '/og-image.webp',         // Default Open Graph image
  version: '1.8',                    // Version (displayed in sidebar)
  footerText: '...',                 // Footer line 1
  footerText2: '...',                // Footer line 2
}
```

### Navigation

```ts
// Header navigation
export const HEADER_LINKS: Link[] = [
  { name: 'Posts', url: '/posts' },
  { name: 'Dynamic', url: '/dynamic' },
  { name: 'Projects', url: '/projects' },
  { name: 'About', url: '/about' },
]

// Footer navigation
export const FOOTER_LINKS: Link[] = [ ... ]

// Sidebar social links (icons from Iconify)
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/Refac7',
    icon: 'icon-[ri--arrow-left-up-line]',
  },
]
```

### Post Configuration `POSTS_CONFIG`

```ts
export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Refact\'s articles',
  introduce: '...',                 // List page introduction
  author: 'Refact',

  // Homepage post cards
  homePageConfig: {
    size: 3,                        // Number of posts shown
    type: 'compact',                // Card style: compact | image | time-line
  },

  // Post list page
  postPageConfig: {
    size: 8,
    type: 'image',
  },

  // Tag filter page
  tagsPageConfig: {
    size: 5,
    type: 'time-line',
  },

  // Author post list page
  authorsPageConfig: {
    size: 8,
    type: 'image',
  },

  defaultHeroImage: '/og-image.webp',
  postType: 'jap',                  // Post layout: jap
  imageDarkenInDark: true,          // Dim images in dark mode
}
```

### Author Page Configuration `AUTHORS_CONFIG`

```ts
export const AUTHORS_CONFIG: AuthorsConfig = {
  title: 'Authors',
  description: 'All post authors',
  introduce: 'Browse posts by author — click an author name to filter their contributions.',
}
```

### Skills Showcase `SKILLSSHOWCASE_CONFIG`

```ts
export const SKILLSSHOWCASE_CONFIG = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    {
      direction: 'left',            // Scroll direction: left | right
      skills: [
        { name: 'JavaScript', icon: 'icon-[mdi--language-javascript]' },
      ],
    },
  ],
}
```

### GitHub Contribution Graph `GITHUB_CONFIG`

```ts
export const GITHUB_CONFIG = {
  ENABLED: true,
  GITHUB_USERNAME: 'Refac7',
  TOOLTIP_ENABLED: true,
}
```

### About Page `ABOUT_CONFIG`

`ABOUT_CONFIG` contains profile info, physical attributes, skill matrix, hardware inventory, gaming log, course schedule, and todo list. All fields are optional — fill in what you need.

### Friends Configuration `FRIENDS_CONFIG` / `FRIENDS_CONTACT`

```ts
export const FRIENDS_CONFIG = {
  title: 'Friends',
  description: '...',
  introduce: '...',
  enableAdd: false,                 // Enable friend link exchange requests
}

// Your site info (for others to copy when exchanging links)
export const FRIENDS_CONTACT = {
  sitename: 'RefactX Project',
  email: 'i@refact.cc',
  author: 'Refac7',
  sitelink: 'https://www.refact.cc',
  siteavatar: 'https://img.refact.cc/base/avatar.jpg',
  description: '...',
}
```

### Comment System `WALINE_CONFIG`

```ts
export const WALINE_CONFIG = {
  enableComment: true,
  serverURL: import.meta.env.PUBLIC_WALINE_SERVER_URL,
  uploadToken: import.meta.env.PUBLIC_UPLOAD_TOKEN,
  imgbedURL: import.meta.env.PUBLIC_IMG_BED_URL,
  enableImgUpload: true,
}
```

### CMS Configuration `CMS_CONFIG`

```ts
export const CMS_CONFIG = {
  enableCMS: true,
  owner: 'Refac7',
  repo: 'RefactX',
  branch: 'main',
  pathPrefix: 'src/content/posts/',
}
```

### Holiday Effects `HOLIDAY_EFFECTS` / `HOLIDAY_THEMES`

```ts
export const HOLIDAY_EFFECTS = {
  enableHolidayEffects: true,
}

// Date-based theme switching
export const HOLIDAY_THEMES = {
  '2026-01-01': {
    theme: 'theme-red',
    message: 'Happy New Year — holiday theme applied.',
  },
  '2026-06-19': {
    theme: 'theme-green',
    message: 'Dragon Boat Festival — green theme applied.',
  },
  // theme-red | theme-green | theme-gold | theme-mourning
}
```

---

## Content Authoring

### Writing Posts

Posts are stored as Markdown files in `src/content/posts/`. Each file requires YAML frontmatter:

```yaml
---
title: My Post Title
description: A brief summary
author: Author Name            # Auto-filled by CMS from logged-in user
pubDate: 2026-06-24
updatedDate: 2026-06-25      # Optional
tags: [notes, astro]          # Optional
heroImage: /path/to/image     # Set to "none" to hide
heroImageLayout: right        # right | left
recommend: true                # Optional — mark as recommended
postType: jap                  # Optional — post layout
---
```

### Managing Friends

Friend data lives in `src/content/data/friends.json`:

```json
[
  {
    "name": "Site Name",
    "url": "https://example.com",
    "author": "Author",
    "description": "Site description",
    "avatar": "https://example.com/avatar.jpg"
  }
]
```

### Managing Projects

Project data lives in `src/content/data/projects.json`:

```json
[
  {
    "name": "Project Name",
    "description": "Project description",
    "githubUrl": "https://github.com/user/repo",
    "website": "https://example.com",
    "type": "icon",
    "icon": "icon-[mdi--github]"
  }
]
```

The `type` field: `"icon"` for an Iconify icon, `"image"` for a custom image.

---

## Deployment Guide

### Vercel (Recommended)

1. Fork this repository
2. Import the project in Vercel
3. Configure environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_USERS` | For CMS | Multi-user JSON mapping (username → bcrypt hash) |
| `ADMIN_JWT_SECRET` | For CMS | JWT signing key (`openssl rand -hex 32`) |
| `CAPTCHA_SECRET` | For CMS | CAPTCHA PoW signing key (`openssl rand -hex 32`) |
| `GITHUB_TOKEN` | For CMS | GitHub Personal Access Token (repo scope) |
| `PUBLIC_WALINE_SERVER_URL` | For comments | Waline server URL |
| `PUBLIC_UPLOAD_TOKEN` | For image uploads | Image bed upload token |
| `PUBLIC_IMG_BED_URL` | For image uploads | Image bed URL |
| `NOTION_API_KEY` | For dynamic feed | Notion API key |
| `NOTION_DATABASE_ID` | For dynamic feed | Notion database ID |

> **Backward compatibility:** The legacy `ADMIN_PASSWORD` single-user variable is still supported (equivalent to user `admin`), but `ADMIN_USERS` multi-user mode is recommended. See [`scripts/README.md`](scripts/README.md).

4. Deploy. Build command and output directory are pre-configured.

### Environment Variable Prefixes

- `PUBLIC_*` — Exposed to the client (Waline, image uploads)
- No prefix — Server-only (CMS API, Notion proxy)

---

## CMS Admin Panel

Visit `/admin` to access the management panel. Complete setup steps below (see [`scripts/README.md`](scripts/README.md) for details):

1. **Generate password hash**: `node scripts/gen-hash.js <username> <password>`
2. **Set environment variables**:
   - `ADMIN_USERS`: Multi-user JSON mapping (`{"username":"bcrypt-hash"}`)
   - `ADMIN_JWT_SECRET`: JWT signing key
   - `CAPTCHA_SECRET`: CAPTCHA verification key
3. **Configure GitHub Token**: generate a token at GitHub Settings → Developer settings → Personal access tokens, write to `GITHUB_TOKEN` (requires `repo` scope)

### Multi-User Support

`ADMIN_USERS` enables independent accounts for each team member. Enter your username and password on the login screen. Features:
- **Case-insensitive** username matching
- JWT tokens valid for **2 hours**, carrying the username claim
- Each user can **only edit their own posts** (enforced via the `author` field in frontmatter)
- The author field in the CMS editor is **auto-filled** from the logged-in user and is read-only
- Legacy `ADMIN_PASSWORD` single-user mode still works (equivalent to user `admin`)

### Panel Overview

| Panel | Function |
|-------|----------|
| **Content (FS)** | Browse posts and config data; click to load into editor |
| **Editor** | Markdown editor with preview, metadata editing, and save-to-queue |
| **Changes Queue (Q)** | Stage all modifications for unified GitHub commit |

### Security

- bcrypt password verification + Proof-of-Work CAPTCHA
- JWT session management (2-hour expiry)
- Login rate limiting: max 5 failed attempts per IP, 15-minute lockout
- CAPTCHA token expiry: 5 minutes
- Author-based access isolation: users can only access and edit their own posts

---

## API Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth` | POST | Username + password login, returns JWT | Username + Password + CAPTCHA |
| `/api/dynamic` | GET | Fetch Notion dynamic feed | CAPTCHA verified |
| `/api/repo-stats` | GET | Get repo file statistics | GitHub Token |
| `/api/batch-commit` | POST | Batch commit changes | GitHub Token |
| `/api/get-content` | GET | Read file content | GitHub Token |
| `/api/list-files` | GET | List repo files | GitHub Token |
| `/api/next-filename` | GET | Generate next post filename | GitHub Token |
| `/api/captcha` | POST | PoW challenge/verification | None |

---

## Themes & Holidays

### Built-in Holiday Themes

| Theme Class | Trigger | Visual Effect |
|-------------|---------|---------------|
| `theme-red` | New Year, Spring Festival, National Day | Red color scheme |
| `theme-green` | Dragon Boat Festival | Green color scheme |
| `theme-gold` | Mid-Autumn Festival | Gold color scheme |
| `theme-mourning` | Qingming, Memorial Days | Full-site grayscale |

### Adding a Custom Theme

1. Define CSS variable overrides in `src/styles/global.css` under `@layer base` (see existing `theme-red` etc.)
2. Add a date entry in `HOLIDAY_THEMES` within `src/config.ts`

```css
html.theme-custom {
  --primary: 280 70% 45%;
  --primary-foreground: 0 0% 100%;
  --accent: 280 60% 95%;
  /* ... other variables */
}
```

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro v6 (static output + SSR endpoints) |
| UI | React v19 (interactive islands) |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` |
| Icons | `@iconify/tailwind4` (Phosphor icon set) |
| State | nanostores (theme toggle) |
| Content | Markdown + YAML frontmatter (Astro Content Collections) |
| Search | Pagefind (build-time indexing) |
| Comments | Waline |
| Math | KaTeX (remark-math + rehype-katex) |
| Deployment | Vercel (Serverless Functions) |

### Path Alias

`~/` maps to `src/` — usable in `.astro`, `.tsx`, and `.ts` files.

### Code Style

- Prettier formatting (140 char width, no semicolons, single quotes)
- `pnpm format` to check, `pnpm format:write` to auto-fix
- TypeScript strict mode

---

## Credits & License

This project is based on [Litos theme](https://github.com/Dnzzk2/Litos) (MIT License).

Maintained by Refac7 under the MIT License.

> [!NOTE]
> Developers have no mandatory obligation to maintain open-source software. Issues and Pull Requests are welcome, but please understand response times may vary.

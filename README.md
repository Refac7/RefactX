# RefactX

English | [简体中文](README.zh-CN.md)

A modern, configurable, and self-hostable content platform built with Astro, React, Tailwind CSS, and TypeScript.

RefactX provides a structured foundation for publishing long-form content, maintaining project and link data, and managing content through an integrated CMS. The project combines a high-density editorial interface with a component-oriented architecture intended for individual developers, technical writers, and content-focused personal websites.

## Technology Stack

- **Astro 6** — application framework, routing, and static generation
- **React 19** — interactive interfaces such as the administration panel
- **TypeScript** — static typing and application contracts
- **Tailwind CSS 4** — styling and design tokens
- **Nano Stores** — lightweight client-side state management
- **Vercel Serverless APIs** — authentication and CMS operations
- **Pagefind** — production-only site search
- **Waline** — comments and message board
- **Notion API** — dynamic feed synchronization
- **GitHub API (Octokit)** — repository-backed content management

## Features

- Markdown-based article publishing with typed content collections
- Configurable post layouts, pagination, tags, authors, and featured content
- Integrated CMS for creating, editing, and deleting repository-backed content
- Support for structured JSON data, including projects, friends, and about-page content
- Multi-user administration with bcrypt password hashing and JWT-based authentication
- Repository-backed publishing through the GitHub API
- Author ownership validation for editorial content
- Configurable site metadata, navigation, social links, comments, and page content
- Light and dark themes, seasonal themes, and optional visual effects
- GitHub contribution activity display
- Skills showcase and build information sections on the homepage
- Pagefind site search (available in production builds only)
- RSS, sitemap, robots.txt, and SEO metadata
- Responsive layouts designed for desktop and mobile environments
- Vercel deployment support

## Requirements

| Dependency | Requirement |
| --- | --- |
| Node.js | 22.12 or later |
| pnpm | 7.1 or later |
| Git | Any supported version |

> Astro 6 requires Node.js `>=22.12.0`. Earlier versions may fail to build the project.

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Refac7/RefactX.git
cd RefactX
pnpm install
```

Copy the environment template and fill in the required values:

```bash
cp example.env .env
```

Start the development server:

```bash
pnpm dev
```

By default, the development server is available at `http://localhost:4321`.

Create a production build:

```bash
pnpm build
```

This command runs type checking, builds the Astro application, and generates the Pagefind search index for `.vercel/output/static`.

Preview the production build locally:

```bash
pnpm preview
```

## Project Structure

```text
RefactX/
├── src/
│   ├── assets/              # Static and application assets
│   ├── components/          # Astro and React components
│   │   ├── admin/           # CMS administration interface
│   │   ├── base/            # Shared base components (search, header, contributions, etc.)
│   │   ├── dynamic/         # Dynamic feed components
│   │   ├── posts/           # Post cards, layouts, table of contents, and comments
│   │   ├── projects/        # Project presentation components
│   │   ├── theme/           # Theme controls
│   │   └── ui/              # General-purpose UI components
│   ├── content/
│   │   ├── data/            # Structured JSON content
│   │   └── posts/           # Markdown articles
│   ├── layouts/             # Application layouts (Header, Footer, Layout)
│   ├── lib/                 # Utilities, authentication, and rate limiting
│   ├── pages/               # Routes and API endpoints
│   │   └── api/             # Server-side endpoints
│   ├── stores/              # Client-side state
│   ├── styles/              # Global and typography styles
│   ├── config.ts            # Central site configuration
│   ├── content.config.ts    # Content collection schemas
│   └── types.ts             # Type definitions
├── plugins/                 # Remark and Rehype extensions
├── scripts/                 # Development and administration utilities
├── public/                  # Public static files
├── astro.config.mjs         # Astro configuration
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vercel.json              # Deployment and cache header configuration
```

## Site Configuration

Primary site configuration is defined in `src/config.ts`. The configuration module controls site metadata, navigation, social links, post presentation, tag and author pages, project displays, the dynamic feed, message board, friends page, comments, CMS behavior, GitHub integration, and optional seasonal themes.

Typical site metadata:

```ts
export const SITE = {
  title: 'RefactX Project',
  description: 'A concise description of the site.',
  website: 'https://example.com',
  base: '/',
  author: 'Author',
  ogImage: '/og-image.webp',
  version: '1.9',
  footerText: 'Footer text',
  footerText2: 'Secondary footer text',
}
```

Review `src/config.ts` before deployment and replace the example values with values appropriate for the target site. Commonly used configuration exports include:

| Configuration | Purpose |
| --- | --- |
| `SITE` | Site title, description, domain, author, and OG image |
| `HEADER_LINKS` / `FOOTER_LINKS` | Header and footer navigation |
| `SOCIAL_LINKS` | Social platform links and icons |
| `POSTS_CONFIG` | Post list density, layout, default cover, and button labels |
| `TAGS_CONFIG` / `AUTHORS_CONFIG` | Tag and author page copy |
| `PROJECTS_CONFIG` / `DYNAMIC_CONFIG` | Project and dynamic feed page copy |
| `FRIENDS_CONFIG` / `FRIENDS_CONTACT` | Friends page and site owner card |
| `WALINE_CONFIG` | Comment server, CAPTCHA, and image upload settings |
| `CMS_CONFIG` | CMS toggle, GitHub repository, branch, and path prefix |
| `HOLIDAY_THEMES` / `HOLIDAY_EFFECTS` | Holiday theme dates and visual effects |
| `PAGE_LOADER_CONFIG` | Page transition loading animation |

## Content Management

### Articles

Articles are stored as Markdown files in `src/content/posts/`. Each article uses YAML frontmatter to define its metadata:

```yaml
---
title: Article Title
description: A concise summary of the article.
pubDate: 2026-01-01
updatedDate: 2026-01-02
author: Author Name
tags:
  - Astro
  - TypeScript
heroImage: cover.webp
heroImageLayout: right
heroImageAspectRatio: '16/9'
recommend: true
postType: jap
contentWarning: Content warning text
---
```

Field reference:

| Field | Required | Description |
| --- | --- | --- |
| `title` | Yes | Article title |
| `description` | Yes | Article summary used in listings and SEO |
| `pubDate` | Yes | Publication date |
| `updatedDate` | No | Last updated date |
| `author` | No | Author name; defaults to `POSTS_CONFIG.author` |
| `tags` | Yes | Array of tags |
| `heroImage` | No | Cover image. Local filenames resolve to `/hero-images/`; full URLs are used as-is; `none` disables the image |
| `ogImage` | No | OG image. Local filenames resolve to `/og-images/`; full URLs are used as-is; `none` disables the image |
| `heroImageLayout` | No | Cover layout, such as `right` |
| `heroImageAspectRatio` | No | Cover aspect ratio; defaults to `16/9` |
| `recommend` | No | Whether to feature the article; defaults to `false` |
| `postType` | No | Post layout variant, such as `jap` |
| `contentWarning` | No | Content warning notice |

Markdown files beginning with `_` are excluded from the content collection and can be used for drafts or partial content.

### Markdown Extensions

The rendering pipeline lives in `plugins/` and supports:

- Reading time estimation and low-quality image placeholders (LQIP)
- Custom directives for badges, links with favicons, and Bilibili embeds
- Math rendering via `remark-math` and `rehype-katex`
- Callout blocks via `rehype-callouts`
- Heading anchors, external link handling, image unwrapping, and table wrappers
- Expressive Code blocks with collapsible sections and line numbers

### Structured Data

Non-article content is stored as JSON under `src/content/data/`. The `friends` and `projects` collections are registered through a custom loader, while `about.json` is imported directly by the about page:

- `friends.json` — friend links
- `projects.json` — project information
- `about.json` — about-page content

Structured data is not treated as an article and does not require post-specific fields such as `author` or `pubDate`.

Example friend entry:

```json
{
  "name": "Site Name",
  "author": "Site Owner",
  "url": "https://example.com",
  "avatar": "https://example.com/avatar.png",
  "description": "A concise description."
}
```

Example project entry:

```json
{
  "name": "Project Name",
  "description": "A concise project description.",
  "githubUrl": "https://github.com/user/repository",
  "website": "https://example.com",
  "type": "icon",
  "icon": "icon-[mdi--github]",
  "star": 0,
  "fork": 0
}
```

`githubUrl` and `website` are optional; `star` and `fork` are required and may be provided as strings or numbers.

## Routes

| Route | Description |
| --- | --- |
| `/` | Homepage with navigation cards, recent posts, contributions, skills, and build information |
| `/posts` | Paginated post list |
| `/posts/[slug]` | Individual post |
| `/tags` | Tag overview |
| `/tags/[tag]` | Posts filtered by tag |
| `/authors` | Author overview |
| `/authors/[author]` | Posts by a specific author |
| `/projects` | Project showcase |
| `/dynamic` | Notion-backed dynamic feed with CAPTCHA verification |
| `/messageboard` | Message board |
| `/friends` | Friend links |
| `/about` | About page |
| `/admin` | CMS administration panel |
| `/api/auth` | Login and JWT issuance |
| `/api/captcha` | Proof-of-work CAPTCHA challenge and verification |
| `/api/dynamic` | Notion dynamic feed proxy |
| `/api/get-content`, `/api/list-files`, `/api/batch-commit`, `/api/next-filename`, `/api/repo-stats` | CMS repository operations |
| `/rss.xml` | RSS feed |
| `/404` | Not found page |

Server-side endpoints must set `export const prerender = false` so they run as Vercel Serverless Functions.

## CMS Administration

The CMS is configured through `CMS_CONFIG` and uses a GitHub repository as its content store by default. Authentication supports multiple administrative users through the `ADMIN_USERS` environment variable.

Generate a password hash with:

```bash
# Default username: admin
node scripts/gen-hash.js <password>

# Specify a username
node scripts/gen-hash.js <username> <password>
```

Add the result to `.env`:

```env
ADMIN_USERS='{"username":"bcrypt-hash"}'
ADMIN_JWT_SECRET=<secure-random-secret>
CAPTCHA_SECRET=<secure-random-secret>
```

CMS publishing also requires repository access:

```env
GITHUB_TOKEN=<github-personal-access-token>
```

The token must have permission to modify the repository and branch configured in `CMS_CONFIG`. Hashes may also be stored as base64 to avoid dotenv `$` variable expansion; the server detects and decodes them automatically.

Authentication flow:

1. The user enters a username and password.
2. The client completes a proof-of-work CAPTCHA (SHA-256 difficulty check).
3. The server verifies the CAPTCHA token, username, and bcrypt password hash.
4. On success, the server issues a JWT valid for 2 hours; subsequent CMS requests use `Authorization: Bearer <token>`.
5. Failed logins are rate-limited (5 failures lock the client IP for 15 minutes by default).

For full authentication, CAPTCHA, and rate-limiting details, see [`scripts/README.md`](scripts/README.md).

## Environment Variables

Copy `example.env` to `.env` and fill in the required values.

| Variable | Required When | Purpose |
| --- | --- | --- |
| `ADMIN_USERS` | CMS is enabled | Administrative users and bcrypt password hashes (JSON) |
| `ADMIN_JWT_SECRET` | CMS is enabled | JWT signing secret |
| `CAPTCHA_SECRET` | CAPTCHA is enabled | CAPTCHA HMAC signing secret |
| `GITHUB_TOKEN` | CMS publishing is enabled | GitHub repository access |
| `NOTION_API_KEY` | Dynamic feed is enabled | Notion API key |
| `NOTION_DATABASE_ID` | Dynamic feed is enabled | Notion database ID |
| `PUBLIC_WALINE_SERVER_URL` | Comments are enabled | Waline server endpoint |
| `PUBLIC_UPLOAD_TOKEN` | Image upload is enabled | Upload service credential |
| `PUBLIC_IMG_BED_URL` | Image upload is enabled | Image hosting endpoint |

Generate a random secret with:

```bash
openssl rand -hex 32
```

Variables prefixed with `PUBLIC_` are exposed to the client. Never put private credentials in them.

Never commit production credentials, access tokens, or private signing keys to the repository.

## Deployment

RefactX uses the `@astrojs/vercel` adapter by default and can be deployed to Vercel or other environments capable of running the Astro site and its server-side API endpoints.

### Vercel

1. Fork or clone the repository.
2. Import the project into Vercel.
3. Configure the required environment variables.
4. Review `src/config.ts`, `CMS_CONFIG`, and the site domain.
5. Deploy the project.

Use `pnpm build` as the build command. Static assets are emitted to `.vercel/output/static`, and the Pagefind index is generated at the end of the build.

`vercel.json` configures baseline security headers and cache policies:

- `/_astro/*` and `/fonts/*` use one-year immutable caching
- `/pagefind/*` uses a one-hour cache with `stale-while-revalidate`

## Comments and External Services

Comment functionality is configured through `WALINE_CONFIG` and is available on post pages and the message board. Image uploads, Notion synchronization, and other integrations are enabled through public environment variables and site configuration.

External services are deployment dependencies. Their availability, security, and operational configuration are the responsibility of the site operator. Before deploying to production, verify that:

- The Waline server is deployed and connected to a database
- The Notion integration has access to the target database
- The image upload token and endpoint are valid
- The GitHub token uses the minimum required permissions

## Theming

RefactX supports application-wide theme configuration, including light and dark modes. Optional date-based themes and seasonal effects can be configured through `HOLIDAY_THEMES` and `HOLIDAY_EFFECTS`.

The page transition loading animation is controlled by `PAGE_LOADER_CONFIG` and can be disabled for a simpler browsing experience.

Theme-related styles live in `src/styles/global.css`, and the holiday component is located at `src/components/base/HolidayTheme.astro`.

## Development

Before submitting changes, ensure that the project builds successfully:

```bash
pnpm build
```

Other common commands:

```bash
pnpm dev           # Start the development server
pnpm format        # Check formatting with Prettier
pnpm format:write  # Automatically fix formatting
```

Development guidelines:

- Preserve the existing TypeScript contracts, content schemas, authentication boundaries, and repository-backed CMS behavior.
- Distinguish editorial posts from structured data. Post-specific validation must not be applied to JSON configuration or data entries that do not use article metadata.
- Pagefind search loads only when `import.meta.env.PROD` is true and is unavailable in development mode.
- React components are used as Astro islands; choose `client:load`, `client:visible`, or another hydration directive as appropriate.
- Inline scripts that rely on `is:inline` (such as theme initialization) are emitted before bundling; take care when modifying them.
- Content collections use Astro's loader-based API rather than the legacy `src/content/config.ts` pattern.

## Contributing

Contributions are welcome through issues and pull requests. Please keep changes focused, document behavior that affects configuration or deployment, and verify the production build before submitting a pull request.

For substantial changes, opening an issue before implementation is recommended so that the proposed approach can be discussed.

## License

This project is distributed under the MIT License. See the repository license file for details.

## Disclaimer

RefactX is provided on an "AS IS" basis, without warranties or guarantees of any kind, express or implied. The repository maintainer is not obligated to provide continuous maintenance, support, or compatibility updates.

Operators are responsible for reviewing configuration, credentials, third-party integrations, and deployment security before using the project in production.

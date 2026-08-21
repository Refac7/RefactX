# RefactX

A modern, configurable, and self-hostable content platform built with Astro, React, Tailwind CSS, and TypeScript.

RefactX provides a structured foundation for publishing long-form content, maintaining project and link data, and managing content through an integrated CMS. The project combines a high-density editorial interface with a component-oriented architecture intended for individual developers, technical writers, and content-focused personal websites.

## Technology Stack

- **Astro 6** — application framework and routing
- **React 19** — interactive administrative interfaces
- **TypeScript** — static typing and application contracts
- **Tailwind CSS 4** — styling and design tokens
- **Nano Stores** — lightweight client-side state management
- **Vercel-compatible server APIs** — authentication and CMS operations

## Features

- Markdown-based article publishing with typed content collections
- Configurable post layouts, pagination, tags, authors, and featured content
- Integrated CMS for creating, editing, and deleting repository-backed content
- Support for structured JSON data, including projects and external links
- Multi-user administration with password hashing and JWT-based authentication
- Repository-backed publishing through the GitHub API
- Author ownership validation for editorial content
- Configurable site metadata, navigation, social links, comments, and page content
- Light and dark themes, seasonal themes, and optional visual effects
- GitHub contribution activity display
- Responsive layouts designed for desktop and mobile environments
- Vercel deployment support

## Requirements

| Dependency | Requirement |
| --- | --- |
| Node.js | 18 or later |
| pnpm | 8 or later |
| Git | Any supported version |

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Refac7/RefactX.git
cd RefactX
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Create a production build:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

By default, the development server is available at `http://localhost:4321`.

## Project Structure

```text
RefactX/
├── src/
│   ├── assets/          # Static and application assets
│   ├── components/      # Astro and React components
│   │   ├── admin/       # CMS administration interface
│   │   ├── base/        # Shared layout components
│   │   ├── dynamic/     # Activity and dynamic content components
│   │   ├── posts/       # Article presentation components
│   │   ├── projects/    # Project presentation components
│   │   ├── theme/       # Theme controls
│   │   └── ui/          # General-purpose UI components
│   ├── content/
│   │   ├── data/        # Structured JSON content
│   │   └── posts/       # Markdown articles
│   ├── layouts/         # Application layouts
│   ├── lib/             # Utilities and authentication logic
│   ├── pages/           # Routes and API endpoints
│   ├── stores/          # Client-side state
│   └── styles/          # Global and typography styles
├── plugins/             # Remark and Rehype extensions
├── scripts/             # Development and administration utilities
├── public/              # Public static files
├── astro.config.mjs     # Astro configuration
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vercel.json          # Deployment configuration
```

## Configuration

Primary site configuration is defined in `src/config.ts`. The configuration module controls site metadata, navigation, social links, post presentation, author pages, project displays, comments, CMS behavior, GitHub integration, and optional seasonal themes.

Typical site metadata includes:

```ts
export const SITE = {
  title: 'RefactX Project',
  description: 'A concise description of the site.',
  website: 'https://example.com',
  author: 'Author',
  ogImage: '/og-image.webp',
}
```

Review `src/config.ts` before deployment and replace the example values with values appropriate for the target site.

## Content Management

### Articles

Articles are stored as Markdown files in `src/content/posts/`. Each article uses YAML frontmatter to define its metadata.

```yaml
---
title: Article Title
description: A concise summary of the article.
author: Author Name
pubDate: 2026-01-01
updatedDate: 2026-01-02
tags: [Astro, TypeScript]
heroImage: /path/to/image.webp
heroImageLayout: right
recommend: true
postType: jap
---
```

The `updatedDate`, `tags`, `heroImage`, `heroImageLayout`, `recommend`, and `postType` fields are optional according to the configured content schema.

### Structured Data

Structured content is stored separately from editorial posts under `src/content/data/`.

Examples include:

- `friends.json` — external links and associated metadata
- `projects.json` — project information and presentation metadata

Structured data is not treated as an article and does not require post-specific fields such as `author`.

An example project entry:

```json
{
  "name": "Project Name",
  "description": "A concise project description.",
  "githubUrl": "https://github.com/user/repository",
  "website": "https://example.com",
  "type": "icon",
  "icon": "icon-[mdi--github]"
}
```

## CMS Administration

The CMS is configured through `CMS_CONFIG` and provides repository-backed content management. Authentication supports multiple administrative users through the `ADMIN_USERS` environment variable.

Generate a password hash with:

```bash
node scripts/gen-hash.js <username> <password>
```

The resulting value can be used to construct the administrative user configuration:

```env
ADMIN_USERS='{"username":"bcrypt-hash"}'
ADMIN_JWT_SECRET=<secure-random-secret>
CAPTCHA_SECRET=<secure-random-secret>
```

Additional repository access is required for CMS publishing:

```env
GITHUB_TOKEN=<github-personal-access-token>
```

The token must have permission to modify the configured repository and branch.

For implementation-specific details, refer to `scripts/README.md` and the CMS configuration in `src/config.ts`.

## Deployment

RefactX is designed to work with Vercel and other environments capable of running Astro applications and the required server-side API endpoints.

### Vercel

1. Fork or clone the repository.
2. Import the project into Vercel.
3. Configure the required environment variables.
4. Review `src/config.ts` and CMS settings.
5. Deploy the project.

Common environment variables include:

| Variable | Required When | Purpose |
| --- | --- | --- |
| `ADMIN_USERS` | CMS is enabled | Administrative user credentials |
| `ADMIN_JWT_SECRET` | CMS is enabled | JWT signing secret |
| `CAPTCHA_SECRET` | CAPTCHA is enabled | CAPTCHA signing secret |
| `GITHUB_TOKEN` | CMS publishing is enabled | Repository access |
| `PUBLIC_WALINE_SERVER_URL` | Comments are enabled | Waline server endpoint |
| `PUBLIC_UPLOAD_TOKEN` | Image upload is enabled | Upload service credential |
| `PUBLIC_IMG_BED_URL` | Image upload is enabled | Image hosting endpoint |

Never commit production credentials, access tokens, or private signing keys to the repository.

## Comments and External Services

Comment functionality is configured through `WALINE_CONFIG`. Image uploads and other optional integrations are configured through public environment variables and site configuration.

External services should be treated as deployment dependencies. Their availability, security, and operational configuration are the responsibility of the site operator.

## Theming

RefactX supports application-wide theme configuration, including light and dark modes. Optional date-based themes and seasonal effects can be configured through `HOLIDAY_THEMES` and `HOLIDAY_EFFECTS`.

Theme behavior is intentionally configurable so that deployments can disable decorative effects or maintain a consistent visual identity throughout the year.

## Development

Before submitting changes, ensure that the project builds successfully:

```bash
pnpm build
```

Changes should preserve the existing TypeScript contracts, content schemas, authentication boundaries, and repository-backed CMS behavior.

When modifying the CMS, distinguish between editorial posts and structured data. Post-specific validation must not be applied to JSON configuration or data entries that do not use article metadata.

## Contributing

Contributions are welcome through issues and pull requests. Please keep changes focused, document behavior that affects configuration or deployment, and verify the production build before submitting a pull request.

For substantial changes, opening an issue before implementation is recommended so that the proposed approach can be discussed.

## License

This project is distributed under the MIT License. See the repository license file for details.

## Disclaimer

RefactX is provided on an "AS IS" basis, without warranties or guarantees of any kind, express or implied. The repository maintainer is not obligated to provide continuous maintenance, support, or compatibility updates.

Operators are responsible for reviewing configuration, credentials, third-party integrations, and deployment security before using the project in production.

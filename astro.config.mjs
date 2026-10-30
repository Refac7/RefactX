// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import expressiveCode, { defineEcConfig } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import vercel from '@astrojs/vercel'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'

const ecConfig = defineEcConfig({
  themes: ['github-dark', 'github-light'],
  themeCssSelector: (theme) => (theme.name === 'github-dark' ? '.dark' : ':root:not(.dark)'),

  defaultLocale: 'zh-CN',
  defaultProps: {
    wrap: false,
    showLineNumbers: false,
    preserveIndent: true,
    collapseStyle: 'collapsible-auto',
  },

  minSyntaxHighlightingColorContrast: 0,
  useDarkModeMediaQuery: false,

  useStyleReset: true,

  styleOverrides: {
    uiFontFamily: "'MiSans VF', ui-sans-serif, system-ui, -apple-system, 'PingFang SC', sans-serif",
    uiFontSize: '0.8125rem',
    codeFontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Consolas, monospace",
    codeFontSize: '0.875rem',
    codeLineHeight: '1.75',

    borderRadius: '0.95rem',
    codePaddingBlock: '1.1rem',
    codePaddingInline: '1.35rem',
    borderColor: ({ theme }) => (theme.type === 'dark' ? '#3a3733' : '#e2dbcf'),

    frames: {
      frameBoxShadowCssValue: '0 10px 30px -22px rgba(42, 34, 24, 0.45)',

      editorBackground: ({ theme }) => (theme.type === 'dark' ? '#1b1a18' : '#fcfaf5'),
      terminalBackground: ({ theme }) => (theme.type === 'dark' ? '#1b1a18' : '#fcfaf5'),

      editorTabBarBackground: ({ theme }) => (theme.type === 'dark' ? '#23211d' : '#f2ede3'),
      editorActiveTabBackground: ({ theme }) => (theme.type === 'dark' ? '#1b1a18' : '#fcfaf5'),
      editorActiveTabIndicatorBottomColor: ({ theme }) => (theme.type === 'dark' ? '#e08a6b' : '#c76645'),
      editorActiveTabIndicatorTopColor: 'transparent',

      terminalTitlebarBackground: ({ theme }) => (theme.type === 'dark' ? '#23211d' : '#f2ede3'),
    },
  },

  plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
})

export default defineConfig({
  site: SITE.website,
  base: SITE.base,

  output: 'static',

  // The dev toolbar entrypoint can return `504 Outdated Optimize Dep` after Vite
  // re-optimizes deps (withastro/astro#16766). Disable it to avoid the console error.
  devToolbar: {
    enabled: false,
  },

  adapter: vercel(),

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'load', // 改为 'load' 提前加载预获取资源
  },
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
    envDir: '.',
    // Admin panel is client:only, so Vite cannot discover these deps at startup.
    // Pre-bundle them to avoid on-demand re-optimization breaking in-flight island hydration.
    optimizeDeps: {
      include: ['react-markdown', 'remark-gfm'],
    },
    build: {
      chunkSizeWarningLimit: 1200,
      minify: 'terser',
      terserOptions: {
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-vendor'
            }
            if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
              return 'utils'
            }
          },
        },
      },
    },
  },
  image:
    process.env.NODE_ENV === 'development'
      ? {}
      : {
          service: {
            entrypoint: 'astro/assets/services/sharp',
          },
          remotePatterns: [
            {
              hostname: '/',
              protocol: 'https',
            },
          ],
        },
  markdown: {
    syntaxHighlight: false,
    remarkPlugins,
    rehypePlugins,
  },
  integrations: [sitemap(), robotsTxt(), react(), expressiveCode(ecConfig), mdx()],
})

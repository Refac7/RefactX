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
    uiFontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    uiFontSize: '0.875rem',
    codeFontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Consolas, monospace",
    codeFontSize: '0.875rem',
    codeLineHeight: '1.7',

    borderRadius: '0.5rem',
    codePaddingBlock: '1rem',
    codePaddingInline: '1.25rem',
    borderColor: ({ theme }) => (theme.type === 'dark' ? '#333333' : '#eaeaea'),

    frames: {
      frameBoxShadowCssValue: 'none',

      editorBackground: ({ theme }) => (theme.type === 'dark' ? '#000000' : '#fafafa'),
      terminalBackground: ({ theme }) => (theme.type === 'dark' ? '#000000' : '#fafafa'),

      editorTabBarBackground: ({ theme }) => (theme.type === 'dark' ? '#111111' : '#f5f5f5'),
      editorActiveTabBackground: ({ theme }) => (theme.type === 'dark' ? '#000000' : '#fafafa'),
      editorActiveTabIndicatorBottomColor: ({ theme }) => (theme.type === 'dark' ? '#ffffff' : '#000000'),
      editorActiveTabIndicatorTopColor: 'transparent',

      terminalTitlebarBackground: ({ theme }) => (theme.type === 'dark' ? '#111111' : '#f5f5f5'),
    },
  },

  plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
})

export default defineConfig({
  site: SITE.website,
  base: SITE.base,

  output: 'static',

  adapter: vercel({
    webAnalytics: { enabled: false },
  }),

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'load', // 改为 'load' 提前加载预获取资源
  },
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
    envDir: '.',
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

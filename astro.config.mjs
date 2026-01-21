// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import expressiveCode from 'astro-expressive-code'
import vercel from '@astrojs/vercel/serverless'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'

export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  
  // [!code warning] 修改这里：Astro 5 中使用 static 配合 adapter 即可支持 SSR
  output: 'static', 
  
  adapter: vercel({
    webAnalytics: { enabled: false },
  }),

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    plugins: [tailwindcss()],
    envDir: '.',
    build: {
      chunkSizeWarningLimit: 1200,
      terserOptions: {
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'framer-vendor': ['framer-motion'],
            'utils': ['clsx', 'tailwind-merge'],
          },
        },
      },
    },
  },
  image: process.env.NODE_ENV === 'development'
    ? {} 
    : {
        service: {
          entrypoint: 'astro/assets/services/sharp',
        },
        remotePatterns: [
          {
            hostname: 'www.refact.cc',
            protocol: 'https',
          },
        ],
      },
  markdown: {
    syntaxHighlight: false,
    remarkPlugins,
    rehypePlugins,
  },
  integrations: [sitemap(), robotsTxt(), react(), expressiveCode(), mdx()],
})
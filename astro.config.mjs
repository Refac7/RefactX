// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import expressiveCode from 'astro-expressive-code'
import vercel from '@astrojs/vercel'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 自定义集成：构建完成后彻底移除 HTML 注释
 * @returns {import('astro').AstroIntegration}
 */
function removeHtmlComments() {
  return {
    name: 'remove-html-comments',
    hooks: {
      /** @param {{ dir: URL }} options */
      'astro:build:done': async ({ dir }) => {
        const distDir = fileURLToPath(dir);
        
        /** @param {string} directory */
        async function processDir(directory) {
          const entries = await fs.readdir(directory, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
              await processDir(fullPath);
            } else if (entry.name.endsWith('.html')) {
              let content = await fs.readFile(fullPath, 'utf-8');
              // 正则移除 HTML 注释 <!-- ... -->
              content = content.replace(/<!--[\s\S]*?-->/g, '');
              await fs.writeFile(fullPath, content);
            }
          }
        }

        try {
          await processDir(distDir);
          // eslint-disable-next-line no-console
          console.log('✅ 已成功从 HTML 文件中移除所有注释');
        } catch (e) {
          console.error('❌ 移除 HTML 注释失败:', e);
        }
      }
    }
  };
}

export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  
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
      
      // 使用 terser 移除 JS/CSS 注释
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
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
  integrations: [
    sitemap(), 
    robotsTxt(), 
    react(), 
    expressiveCode(), 
    mdx(),
    removeHtmlComments() 
  ],
})
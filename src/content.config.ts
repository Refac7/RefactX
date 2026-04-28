import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { POSTS_CONFIG } from './config';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 创建自定义 JSON 加载器，自动为数组元素注入 ID
 */
function createJsonLoader(filePath: string) {
  return {
    name: 'auto-json-id-loader',
    load: async ({ store, logger, parseData }: any) => {
      const absolutePath = path.resolve(filePath);
      const rawContents = await fs.readFile(absolutePath, 'utf-8');
      const json = JSON.parse(rawContents);

      if (Array.isArray(json)) {
        for (const [index, item] of json.entries()) {
          const entryId = String(item.id || item.name || item.title || index);
          const data = await parseData({ id: entryId, data: item });
          store.set({ id: entryId, data });
        }
      } else {
        logger.error(`Expected an array in ${filePath}, but got ${typeof json}`);
      }
    },
  };
}

// 博客文章集合
const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    recommend: z.boolean().default(false),
    author: z.string().default(POSTS_CONFIG.author),
    heroImage: z.string().optional().transform(val => {
      if (!val) return undefined;
      return val.startsWith('http') || val === 'none' ? val : `/hero-images/${val}`;
    }),
    ogImage: z.string().optional().transform(val => {
      if (!val) return undefined;
      return val.startsWith('http') || val === 'none' ? val : `/og-images/${val}`;
    }),
    heroImageLayout: z.string().optional(),
    heroImageAspectRatio: z.string().default(POSTS_CONFIG.defaultHeroImageAspectRatio),
    tags: z.array(z.string()),
    postType: z.string().optional(),
  }),
});

// 友链数据集合
const friends = defineCollection({
  loader: createJsonLoader('./src/content/data/friends.json'),
  schema: z.object({
    name: z.string(),
    url: z.string(),
    author: z.string(),
    description: z.string(),
    avatar: z.string(),
  }),
});

// 项目数据集合
const projects = defineCollection({
  loader: createJsonLoader('./src/content/data/projects.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    githubUrl: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    type: z.string(),
    icon: z.string(),
    star: z.union([z.string(), z.number()]).transform(v => String(v)),
    fork: z.union([z.string(), z.number()]).transform(v => String(v)),
  }),
});

export const collections = { posts, friends, projects }

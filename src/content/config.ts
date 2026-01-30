// src/content/config.ts
import { defineCollection, z } from 'astro:content'
import { POSTS_CONFIG } from '~/config'
import type { HeroImageAspectRatio, HeroImageLayout, PostType } from '~/types'

// =========================================
// 1. 新增：Data 集合配置 (修复 JSON 报错)
// =========================================
const data = defineCollection({
  type: 'data',
  schema: z.union([
    // 1. Friends (朋友列表)
    z.array(z.object({
      name: z.string(),
      url: z.string(),
      author: z.string(),
      description: z.string(),
      avatar: z.string(),
    })),

    // 2. Photos (相册列表)
    z.array(z.object({
      title: z.string(),
      icon: z.object({
        type: z.string(),
        value: z.string(),
      }),
      description: z.string(),
      date: z.string(),
      photos: z.array(z.object({
        src: z.string(),
        width: z.number(),
        height: z.number(),
        variant: z.string().optional(),
      })),
    })),

    // 3. Projects (项目列表 - 包含类型修复)
    z.array(z.object({
      name: z.string(),
      description: z.string(),
      // 允许 null 或 undefined，解决 website/githubUrl 缺失报错
      githubUrl: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      type: z.string(),
      icon: z.string(),
      // 兼容数字和字符串 (如 "0" 和 0)，统一转为字符串
      star: z.union([z.string(), z.number()]).transform((v) => String(v)),
      fork: z.union([z.string(), z.number()]).transform((v) => String(v)),
    })),
  ]),
})

// =========================================
// 2. 原有：Posts 集合配置 (保持不变)
// =========================================
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    // 文章标题（必需）
    title: z.string(),
    // 文章描述（可选）
    description: z.string(),
    // 发布日期（必需）
    pubDate: z.date(),
    // 更新日期（可选）
    updatedDate: z.date().optional(),
    // 是否推荐文章，默认为 false
    recommend: z.boolean().default(false),
    // 文章作者，默认使用全局配置中的作者
    author: z.string().default(POSTS_CONFIG.author),
    // 文章封面图（可选）
    heroImage: z
      .string()
      .transform((val) => {
        if (!val) return undefined
        if (val === 'none') return 'none' 
        return val.startsWith('http') ? val : `/hero-images/${val}`
      })
      .optional(),

    ogImage: z
      .string()
      .transform((val) => {
        if (!val) return undefined
        if (val === 'none') return 'none'
        return val.startsWith('http') ? val : `/og-images/${val}`
      })
      .optional(),
    // 封面图布局方式（可选）
    heroImageLayout: z.custom<HeroImageLayout>().optional(),
    // 封面图宽高比，默认使用全局配置
    heroImageAspectRatio: z.custom<HeroImageAspectRatio>().default(POSTS_CONFIG.defaultHeroImageAspectRatio),
    // 文章标签列表
    tags: z.array(z.string()),
    // 文章类型
    postType: z.custom<PostType>().optional(),
  }),
})

// =========================================
// 3. 导出所有集合
// =========================================
export const collections = { 
  posts, 
  data 
}
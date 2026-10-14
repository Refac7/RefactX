import type { CollectionEntry } from 'astro:content'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

// 文章按时间排序
export function postsSort(posts: CollectionEntry<'posts'>[]) {
  return posts.sort((a, b) => {
    const dateA = a.data.updatedDate || a.data.pubDate
    const dateB = b.data.updatedDate || b.data.pubDate
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })
}

// 日期格式化
export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

// 统计文章字数（中文按字、英文按词）
export function getWordCount(content: string) {
  if (!content) return 0
  let cleanContent = content
  cleanContent = cleanContent.replace(/^---[\s\S]*?---\s*/, '')
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '')
  cleanContent = cleanContent.replace(/<[^>]+>/g, '')
  cleanContent = cleanContent.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  cleanContent = cleanContent.replace(/!\[.*?\]\(.*?\)/g, '')
  cleanContent = cleanContent.replace(/[*#>`~\-\[\]]/g, '')
  const cn = (cleanContent.match(/[一-龥]/g) || []).length
  const en = (cleanContent.replace(/[一-龥]/g, ' ').match(/[a-zA-Z0-9_\-]+/g) || []).length
  return cn + en
}

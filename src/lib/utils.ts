import type { CollectionEntry } from 'astro:content';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind 类名，优先级更高的样式会覆盖冲突的样式
 */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

/**
 * 按发布或更新时间从新到旧排序文章
 */
export function postsSort(posts: CollectionEntry<'posts'>[]) {
  return posts.sort((a, b) => {
    const dateA = a.data.updatedDate || a.data.pubDate;
    const dateB = b.data.updatedDate || b.data.pubDate;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

/**
 * 格式化日期为 "Month Day, Year" 格式
 */
export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

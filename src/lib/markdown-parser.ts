// Markdown 解析工具库 - 提取和处理 YAML frontmatter 和 Markdown 内容

import { DEFAULT_META, type MetaType } from '~/components/admin/types';

/**
 * 从 YAML frontmatter 字符串中提取指定 key 的值
 * @param yamlBlock - YAML 块内容
 * @param key - 要提取的键名
 * @param isString - 是否为字符串类型（用于处理引号）
 * @returns 提取的值，不存在返回空字符串
 */
function extractYAMLValue(yamlBlock: string, key: string, isString: boolean = true): string {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'm');
  const match = yamlBlock.match(regex);

  if (!match) return '';

  let value = match[1].trim();

  // 移除字符串类型的单引号并处理转义
  if (isString && value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

/**
 * 解析标签字符串并转换为逗号分隔的格式
 * @param tagsString - YAML 数组格式的标签字符串，如 "[tag1, tag2]"
 * @returns 逗号分隔的标签字符串
 */
function parseTags(tagsString: string): string {
  return tagsString
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(t => t.trim().replace(/^'|'$/g, ''))
    .join(', ');
}

/**
 * 处理图片 URL，如果值为 'none' 返回空字符串
 * @param value - 原始值
 * @returns 处理后的图片 URL 或空字符串
 */
function processImageUrl(value: string): string {
  return value === 'none' ? '' : value;
}

/**
 * 解析包含 YAML frontmatter 的 Markdown 内容
 * @param raw - 原始 Markdown 内容（包含 frontmatter）
 * @returns 包含 meta 和 body 的对象
 */
export function parseContent(raw: string): { meta: MetaType; body: string } {
  try {
    // 匹配 --- 分隔符之间的 YAML 块
    const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = raw.match(regex);

    if (!match) {
      return { meta: DEFAULT_META, body: raw };
    }

    const yamlBlock = match[1];
    const bodyContent = match[2].trim();

    // 提取各个字段
    const title = extractYAMLValue(yamlBlock, 'title');
    const description = extractYAMLValue(yamlBlock, 'description');
    const pubDate = extractYAMLValue(yamlBlock, 'pubDate', false);
    const author = extractYAMLValue(yamlBlock, 'author');
    const tags = parseTags(extractYAMLValue(yamlBlock, 'tags', false));
    const recommend = extractYAMLValue(yamlBlock, 'recommend', false) === 'true';
    const heroImage = processImageUrl(extractYAMLValue(yamlBlock, 'heroImage', false));
    const ogImage = processImageUrl(extractYAMLValue(yamlBlock, 'ogImage', false));
    const heroImageAspectRatio = extractYAMLValue(yamlBlock, 'heroImageAspectRatio') || '16/9';

    const newMeta: MetaType = {
      title,
      description,
      pubDate,
      author,
      tags,
      recommend,
      heroImage,
      ogImage,
      heroImageAspectRatio
    };

    return { meta: { ...DEFAULT_META, ...newMeta }, body: bodyContent };
  } catch {
    return { meta: DEFAULT_META, body: raw };
  }
}

/**
 * 构建包含 YAML frontmatter 的 Markdown 内容
 * @param meta - 元数据对象
 * @param body - Markdown 正文内容
 * @returns 完整的 Markdown 字符串
 */
export function buildContent(meta: MetaType, body: string): string {
  const tagsArray = meta.tags
    .split(/[,，]/)
    .map(t => `'${t.trim()}'`)
    .filter(Boolean)
    .join(', ');

  return `---
title: '${meta.title.replace(/'/g, "''")}'
description: '${meta.description.replace(/'/g, "''")}'
pubDate: ${meta.pubDate}
author: '${meta.author}'
tags: [${tagsArray}]
recommend: ${meta.recommend}
heroImage: ${meta.heroImage || 'none'}
ogImage: ${meta.ogImage || 'none'}
heroImageAspectRatio: '${meta.heroImageAspectRatio}'
---

${body}`;
}

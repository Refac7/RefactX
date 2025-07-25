import { visit } from 'unist-util-visit'
import remarkSmartypants from 'remark-smartypants'
import remarkDirective from 'remark-directive'
import remarkDirectiveSugar from 'remark-directive-sugar'
import remarkImgAttr from 'remark-imgattr'
import remarkMath from 'remark-math'
import remarkReadingTime from './remark-reading-time'
import remarkLQIP from './remark-lqip.js'

import rehypeSlug from 'rehype-slug'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeCallouts from 'rehype-callouts'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'

import type { RemarkPlugin, RehypePlugin } from '@astrojs/markdown-remark'
import { type PropertiesFromTextDirective } from 'remark-directive-sugar'
import { type CreateProperties } from 'rehype-external-links'

export const remarkPlugins = [
  remarkSmartypants,
  remarkDirective,
  [
    remarkDirectiveSugar,
    {
      badge: {
        presets: {
          n: { text: 'NEW' },
        },
      },
      link: {
        // faviconSourceUrl: 'https://icon.horse/icon/{domain}',// 1000/month
        faviconSourceUrl: 'https://www.google.com/s2/favicons?domain={domain}&sz=128', // recommended ✨
        imgProps: (node: Parameters<PropertiesFromTextDirective>[0]) => {
          const props: ReturnType<PropertiesFromTextDirective> = {
            'aria-hidden': 'true',
          }
          if (node.attributes?.class?.includes('github')) props.src = 'https://www.google.com/s2/favicons?domain=github.com&sz=128'
          return props
        },
      },
      image: {
        stripParagraph: false,
      },
      video: {
        platforms: {
          // 禁止自动播放，避免干扰
          bilibili: 'https://player.bilibili.com/player.html?bvid={id}&autoplay=0',
        },
      },
    },
  ],
  remarkImgAttr,
  remarkMath,
  remarkReadingTime,
  remarkLQIP,
] as RemarkPlugin[]

export const rehypePlugins = [
  rehypeSlug,
  rehypeUnwrapImages,
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      properties: (el: Parameters<CreateProperties>[0]) => {
        let text = ''
        visit(el, 'text', (textNode) => {
          text += textNode.value
        })
        return {
          'class': 'header-anchor',
          'aria-hidden': 'false',
          'aria-label': text ? `Link to ${text}` : undefined,
        }
      },
      content: (heading: any) => {
        const level = heading.tagName[1]
        return {
          type: 'text',
          value: 'h' + level,
        }
      },
    },
  ],
  [rehypeCallouts, { theme: 'vitepress' }],
  [
    rehypeExternalLinks,
    {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    },
  ],
  rehypeKatex,
] as RehypePlugin[]

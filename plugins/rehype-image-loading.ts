import { visit } from 'unist-util-visit'
import type { RehypePlugin } from '@astrojs/markdown-remark'

/**
 * 为所有图片添加懒加载和占位符样式
 */
const rehypeImageLoading: RehypePlugin = () => {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        // 添加 loading="lazy" 属性
        node.properties ??= {}
        if (!node.properties.loading) {
          node.properties.loading = 'lazy'
        }
        
        // 为远程图片添加 decoding="async"
        if (node.properties.src && typeof node.properties.src === 'string') {
          if (node.properties.src.startsWith('http') || node.properties.src.startsWith('//')) {
            if (!node.properties.decoding) {
              node.properties.decoding = 'async'
            }
            
            // 添加 loading 类用于 CSS 过渡
            const className = node.properties.class || ''
            node.properties.class = `${className} lazy-image`.trim()
          }
        }
      }
    })
  }
}

export default rehypeImageLoading

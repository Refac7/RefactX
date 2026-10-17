import { SKIP, visit } from 'unist-util-visit'
import type { RehypePlugin } from '@astrojs/markdown-remark'

const WRAPPER_CLASS = 'table-wrapper'

/**
 * Wrap tables in a scrollable container.
 *
 * Applying `display: block` to a table makes it scrollable, but the inner
 * anonymous table box then shrinks to its content width instead of filling
 * the container. Keeping the table as a real table inside a wrapper solves
 * both problems: narrow tables stretch to full width, wide tables scroll.
 */
const rehypeTableWrapper: RehypePlugin = () => (tree) => {
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'table' || index === undefined || !parent) return

    // Avoid wrapping a table twice.
    if (parent.type === 'element') {
      const className = parent.properties?.className
      if (Array.isArray(className) && className.includes(WRAPPER_CLASS)) return SKIP
    }

    parent.children[index] = {
      type: 'element',
      tagName: 'div',
      properties: { className: [WRAPPER_CLASS] },
      children: [node],
    }

    return SKIP
  })
}

export default rehypeTableWrapper

import type { ComponentPropsWithoutRef } from 'react'

/**
 * Wraps tables in the same scrollable container used by the rehype plugin,
 * so tables rendered by react-markdown behave like article tables.
 */
export default function MarkdownTable(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="table-wrapper">
      <table {...props} />
    </div>
  )
}

import React, { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '~/lib/utils'
import { WALINE_CONFIG } from '~/config'
import { useAdmin } from '../AdminContext'

interface PostEditorProps {
  showPreview: boolean
  showMetaConfig: boolean
}

export default function PostEditor({ showPreview, showMetaConfig }: PostEditorProps) {
  const { body, setBody, meta, setMeta, triggerUpload, stageForWrite, username } = useAdmin()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selection = text.substring(start, end)
    const newText = text.substring(0, start) + before + selection + after + text.substring(end)
    setBody(newText)
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        const newCursorPos = start + before.length + selection.length + after.length
        textarea.setSelectionRange(start === end ? start + before.length : start, newCursorPos)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          insertText('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertText('*', '*')
          break
        case 'k':
          e.preventDefault()
          insertText('[', '](url)')
          break
        case 's':
          e.preventDefault()
          stageForWrite()
          break
      }
    }
  }

  const TOOLBAR_ITEMS = [
    { icon: 'icon-[ph--text-b]', label: 'Bold', action: () => insertText('**', '**') },
    { icon: 'icon-[ph--text-italic]', label: 'Italic', action: () => insertText('*', '*') },
    { icon: 'icon-[ph--text-strikethrough]', label: 'Strike', action: () => insertText('~~', '~~') },
    { icon: 'icon-[ph--code]', label: 'Code', action: () => insertText('`', '`') },
    { icon: 'icon-[ph--link]', label: 'Link', action: () => insertText('[', '](url)') },
    { icon: 'icon-[ph--quotes]', label: 'Quote', action: () => insertText('> ', '') },
    { icon: 'icon-[ph--list-bullets]', label: 'List', action: () => insertText('- ', '') },
    { icon: 'icon-[ph--text-h-one]', label: 'H1', action: () => insertText('# ', '') },
    { icon: 'icon-[ph--text-h-two]', label: 'H2', action: () => insertText('## ', '') },
    ...(WALINE_CONFIG.enableImgUpload
      ? [
          {
            icon: 'icon-[ph--image]',
            label: 'Img',
            action: () => triggerUpload('body'),
          },
        ]
      : []),
  ]

  return (
    <>
      {showMetaConfig && !showPreview && (
        <div className="bg-muted/10 border-b border-border/40 p-4 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title</label>
              <input
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xs px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                placeholder="Post Title"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
              <input
                type="date"
                value={meta.pubDate}
                onChange={(e) => setMeta({ ...meta, pubDate: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xs px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Author
              </label>
              <div className="w-full bg-muted/30 border border-border/40 rounded-xs px-3 py-2 text-sm text-muted-foreground font-mono select-all">
                {username || meta.author || '—'}
              </div>
            </div>
            <div className="sm:col-span-8">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
              <input
                value={meta.description}
                onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xs px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                placeholder="Brief summary of the post..."
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma separated)</label>
              <input
                value={meta.tags}
                onChange={(e) => setMeta({ ...meta, tags: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xs px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                placeholder="tech, life, code"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="flex justify-between items-end text-xs font-medium text-muted-foreground mb-1.5">
                <span>Cover Image</span>
                {WALINE_CONFIG.enableImgUpload && (
                  <span onClick={() => triggerUpload('hero')} className="cursor-pointer text-primary hover:underline">
                    Upload
                  </span>
                )}
              </label>
              <input
                value={meta.heroImage}
                onChange={(e) => setMeta({ ...meta, heroImage: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xs px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-12 flex items-center mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={meta.recommend}
                  onChange={(e) => setMeta({ ...meta, recommend: e.target.checked })}
                  className="size-4 rounded border-border/40 text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-foreground">Featured Post</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      {!showPreview && (
        <div className="border-b border-border/40 bg-background shrink-0 px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TOOLBAR_ITEMS.map((tool, i) => (
            <button
              key={i}
              onClick={tool.action}
              title={tool.label}
              className="p-2 rounded-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            >
              <span className={cn('size-4', tool.icon)}></span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 relative flex flex-col min-h-0 bg-background">
        {showPreview ? (
          <div className="absolute inset-0 overflow-y-auto w-full p-6 sm:p-10 custom-scrollbar">
            <div className="mx-auto prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-6 sm:p-10 bg-transparent text-sm sm:text-base leading-relaxed resize-none focus:outline-none custom-scrollbar placeholder:text-muted-foreground/30"
            placeholder="Write your content here... (Markdown supported)"
            spellCheck={false}
          />
        )}
      </div>
    </>
  )
}

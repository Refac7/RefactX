import { cn } from '~/lib/utils'
import { useAdmin } from '../AdminContext'
import { DATA_FILES } from '../types'

export default function DataPanel() {
  const { mobileView, showLeftPanel, handleNewPost, fetchRemoteFiles, loadFile, filename, isLoadingFiles, remoteFiles, stageForDelete } =
    useAdmin()

  const sortedRemoteFiles = [...remoteFiles].sort((a, b) => {
    const getPostNumber = (name: string) => {
      const match = name.match(/^post-(\d+)\.md$/i)
      return match ? Number(match[1]) : null
    }

    const aNumber = getPostNumber(a.name)
    const bNumber = getPostNumber(b.name)

    if (aNumber !== null && bNumber !== null) return bNumber - aNumber
    if (aNumber !== null) return -1
    if (bNumber !== null) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div
      className={cn(
        'surface relative flex-col overflow-hidden transition-all duration-300',
        mobileView === 'files' ? 'flex h-[70svh] min-h-80' : 'hidden',
        showLeftPanel ? 'lg:flex lg:col-span-3 xl:col-span-3' : 'lg:hidden',
        'lg:h-[calc(100vh-20rem)] lg:min-h-[30rem] lg:max-h-none'
      )}
    >
      <div className="h-14 px-4 border-b border-border/60 flex justify-between items-center bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <span className="icon-[ph--folder-open] size-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">内容库</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleNewPost}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="New Post"
          >
            <span className="icon-[ph--plus] size-3.5" />
          </button>
          <button
            onClick={() => fetchRemoteFiles()}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Refresh"
          >
            <span className="icon-[ph--arrows-clockwise] size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        <div className="px-2 py-2 text-[0.6rem] font-mono text-muted-foreground/60 uppercase tracking-[0.16em]">配置数据</div>
        <div className="space-y-0.5 mb-4">
          {DATA_FILES.map((f) => (
            <div
              key={f.name}
              onClick={() => loadFile(f.name, true, f.path)}
              className={cn(
                'group flex items-center justify-between rounded-xl text-sm px-3 py-2 cursor-pointer transition-all',
                filename === f.name ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span
                  className={cn(
                    'icon-[ph--brackets-curly] size-4 shrink-0',
                    filename === f.name ? 'text-primary' : 'text-muted-foreground/60'
                  )}
                />
                <span className="truncate">{f.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-2 py-2 text-[0.6rem] font-mono text-muted-foreground/60 uppercase tracking-[0.16em] border-t border-border/50 mt-2 pt-4">
          文章
        </div>
        <div className="space-y-0.5">
          {isLoadingFiles ? (
            <div className="p-4 flex justify-center">
              <span className="icon-[ph--spinner] animate-spin text-muted-foreground size-5" />
            </div>
          ) : (
            sortedRemoteFiles.map((f) => (
              <div
                key={f.sha}
                className={cn(
                  'group flex justify-between items-center rounded-xl text-sm px-3 py-2 cursor-pointer transition-all',
                  filename === f.name ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <span
                    className={cn(
                      'icon-[ph--file-text] size-4 shrink-0',
                      filename === f.name ? 'text-primary' : 'text-muted-foreground/60'
                    )}
                  />
                  <span onClick={() => loadFile(f.name)} className="truncate flex-1">
                    {f.name.replace('.md', '')}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    stageForDelete(f)
                  }}
                  className="text-muted-foreground/40 hover:text-danger p-1 hover:bg-danger/10 transition-colors shrink-0"
                  title="Delete"
                  aria-label={`Delete ${f.name}`}
                >
                  <span className="icon-[ph--trash] size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

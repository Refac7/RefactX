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
        'flex-col bg-background/70 border border-primary/15 rounded-3xl  transition-all duration-300 relative overflow-hidden',
        mobileView === 'files' ? 'flex h-[calc(100vh-12rem)]' : 'hidden',
        showLeftPanel ? 'lg:flex lg:col-span-3 xl:col-span-2' : 'lg:hidden',
        'lg:h-auto lg:min-h-100 lg:max-h-[calc(100vh-8rem)]'
      )}
    >
      <div className="h-12 px-4 border-b border-primary/15 flex justify-between items-center bg-accent/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
            FS
          </span>
          <span className="text-sm font-bold text-foreground">内容管理 📁</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleNewPost}
            className="px-2 py-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
            title="New Post"
          >
            <span className="icon-[ph--plus] size-3.5" />
          </button>
          <button
            onClick={() => fetchRemoteFiles()}
            className="px-2 py-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
            title="Refresh"
          >
            <span className="icon-[ph--arrows-clockwise] size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        <div className="px-2 py-2 text-[10px] font-bold text-primary/60">配置数据</div>
        <div className="space-y-0.5 mb-4">
          {DATA_FILES.map((f) => (
            <div
              key={f.name}
              onClick={() => loadFile(f.name, true, f.path)}
              className={cn(
                'group flex items-center justify-between text-sm px-3 py-2 rounded-xl cursor-pointer transition-all',
                filename === f.name ? 'bg-primary/15 text-primary font-bold' : 'text-muted-foreground hover:bg-accent'
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

        <div className="px-2 py-2 text-[10px] font-bold text-primary/60 border-t border-primary/15 mt-2 pt-4">文章与帖子 📝</div>
        <div className="space-y-0.5">
          {isLoadingFiles ? (
            <div className="p-4 flex justify-center">
              <span className="icon-[ph--spinner] animate-spin text-primary size-5" />
            </div>
          ) : (
            sortedRemoteFiles.map((f) => (
              <div
                key={f.sha}
                className={cn(
                  'group flex justify-between items-center text-sm px-3 py-2 rounded-xl cursor-pointer transition-all',
                  filename === f.name ? 'bg-primary/15 text-primary font-bold' : 'text-muted-foreground hover:bg-accent'
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
                  className="text-muted-foreground/40 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
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

import { cn } from '~/lib/utils'
import { useAdmin } from '../AdminContext'
import { DATA_FILES } from '../types'

export default function DataPanel() {
  const { mobileView, showLeftPanel, handleNewPost, fetchRemoteFiles, loadFile, filename, isLoadingFiles, remoteFiles, stageForDelete } =
    useAdmin()

  return (
    <div
      className={cn(
        'flex-col bg-background/50 rounded-xl border border-border/40 transition-all duration-300 relative overflow-hidden',
        mobileView === 'files' ? 'flex h-[calc(100vh-12rem)]' : 'hidden',
        showLeftPanel ? 'lg:flex lg:col-span-3 xl:col-span-2' : 'lg:hidden',
        'lg:h-auto lg:min-h-100 lg:max-h-[calc(100vh-8rem)]'
      )}
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-border/40 flex justify-between items-center bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center size-5 rounded bg-primary/10 text-primary font-mono text-[9px] font-bold">
            FS
          </span>
          <span className="text-sm font-semibold text-foreground">Content</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleNewPost}
            className="px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="New Post"
          >
            <span className="icon-[ph--plus] size-3.5" />
          </button>
          <button
            onClick={() => fetchRemoteFiles()}
            className="px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <span className="icon-[ph--arrows-clockwise] size-3.5" />
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        <div className="px-2 py-2 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">Config Data</div>
        <div className="space-y-0.5 mb-4">
          {DATA_FILES.map((f) => (
            <div
              key={f.name}
              onClick={() => loadFile(f.name, true, f.path)}
              className={cn(
                'group flex items-center justify-between text-sm px-3 py-2 rounded-md cursor-pointer transition-all',
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

        <div className="px-2 py-2 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest border-t border-border/40 mt-2 pt-4">
          Posts & Articles
        </div>
        <div className="space-y-0.5">
          {isLoadingFiles ? (
            <div className="p-4 flex justify-center">
              <span className="icon-[ph--spinner] animate-spin text-muted-foreground size-5" />
            </div>
          ) : (
            remoteFiles.map((f) => (
              <div
                key={f.sha}
                className={cn(
                  'group flex justify-between items-center text-sm px-3 py-2 rounded-md cursor-pointer transition-all',
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
                  className="text-muted-foreground/40 hover:text-red-500 p-1 rounded-md hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete"
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

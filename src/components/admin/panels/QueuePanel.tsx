import { cn } from '~/lib/utils'
import { useAdmin } from '../AdminContext'

export default function QueuePanel() {
  const { mobileView, showRightPanel, queue, loadFromQueue, removeFromQueue, processQueue, isProcessingQueue, handleLogout } = useAdmin()

  return (
    <div
      className={cn(
        'surface relative flex-col overflow-hidden transition-all duration-300',
        mobileView === 'queue' ? 'flex h-[70svh] min-h-80 lg:h-auto' : 'hidden',
        showRightPanel ? 'lg:flex lg:col-span-3 xl:col-span-3' : 'lg:hidden'
      )}
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-border/60 flex justify-between items-center bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <span className="icon-[ph--queue] size-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">变更队列</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground rounded bg-muted/50 px-2 py-0.5">{queue.length}</span>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1 -mr-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="icon-[ph--sign-out] size-4" />
          </button>
        </div>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="icon-[ph--check-circle] size-8 mb-3 text-muted-foreground/30" />
            <span className="text-[10px] font-mono uppercase tracking-widest">暂无待提交改动</span>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col gap-2 rounded-xl border border-border/70 bg-background p-3 transition-all hover:border-primary/35 hover:shadow-sm"
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    'text-[9px] font-mono font-semibold uppercase rounded px-2 py-0.5',
                    item.type === 'delete' ? 'text-danger bg-danger/10' : 'text-success bg-success/10'
                  )}
                >
                  {item.type === 'delete' ? 'Delete' : 'Write'} • {item.isDataFile ? 'JSON' : 'MD'}
                </span>
                <div className="flex gap-1">
                  {item.type === 'write' && (
                    <button
                      onClick={() => loadFromQueue(item)}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <span className="icon-[ph--pencil-simple] size-3.5" />
                    </button>
                  )}
                  {item.status === 'pending' && (
                    <button
                      onClick={(e) => removeFromQueue(item.id, e)}
                      className="p-1 hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                      title="Remove"
                    >
                      <span className="icon-[ph--x] size-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium truncate text-foreground" title={item.filename}>
                  {item.filename.split('/').pop()}
                </div>
                {item.status !== 'pending' && (
                  <div
                    className={cn(
                      'text-[10px] mt-1 font-mono uppercase tracking-widest',
                      item.status === 'done' ? 'text-success' : 'text-warning animate-pulse'
                    )}
                  >
                    {item.status === 'done' ? 'Completed' : 'Processing...'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Commit button */}
      <div className="p-4 border-t border-border/40 bg-muted/10">
        <button
          onClick={processQueue}
          disabled={isProcessingQueue || queue.length === 0}
          className={cn(
            'w-full py-2.5 text-[10px] font-mono font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2',
            isProcessingQueue || queue.length === 0
              ? 'cursor-not-allowed bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
          )}
        >
          {isProcessingQueue ? (
            <>
              <span className="icon-[ph--spinner] size-4 animate-spin" /> 提交中...
            </>
          ) : (
            '提交改动'
          )}
        </button>
      </div>
    </div>
  )
}

import { cn } from '~/lib/utils'
import { useAdmin } from '../AdminContext'

export default function QueuePanel() {
  const { mobileView, showRightPanel, queue, loadFromQueue, removeFromQueue, processQueue, isProcessingQueue } = useAdmin()

  return (
    <div
      className={cn(
        'flex-col bg-background rounded-lg border border-border/40 transition-all duration-300 relative overflow-hidden',
        mobileView === 'queue' ? 'flex h-[calc(100vh-12rem)] lg:h-auto' : 'hidden',
        showRightPanel ? 'lg:flex lg:col-span-3 xl:col-span-3' : 'lg:hidden'
      )}
    >
      <div className="h-12 px-4 border-b border-border/40 flex justify-between items-center bg-muted/20">
        <span className="text-sm font-semibold text-foreground">Changes Queue</span>
        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{queue.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="icon-[ph--check-circle] size-8 mb-3 text-muted-foreground/30"></span>
            <span className="text-sm font-medium">No pending changes</span>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="relative bg-background border border-border/40 rounded-xs p-3 flex flex-col gap-2 group hover:border-border hover:shadow-xs transition-all"
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs',
                    item.type === 'delete'
                      ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
                      : 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                  )}
                >
                  {item.type === 'delete' ? 'Delete' : 'Write'} • {item.isDataFile ? 'JSON' : 'MD'}
                </span>
                <div className="flex gap-1">
                  {item.type === 'write' && (
                    <button
                      onClick={() => loadFromQueue(item)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <span className="icon-[ph--pencil-simple] size-3.5"></span>
                    </button>
                  )}
                  {item.status === 'pending' && (
                    <button
                      onClick={(e) => removeFromQueue(item.id, e)}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                      title="Remove"
                    >
                      <span className="icon-[ph--x] size-3.5"></span>
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
                      'text-xs mt-1 font-medium',
                      item.status === 'done' ? 'text-emerald-500' : 'text-yellow-500 animate-pulse'
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

      <div className="p-4 border-t border-border/40 bg-muted/10">
        <button
          onClick={processQueue}
          disabled={isProcessingQueue || queue.length === 0}
          className={cn(
            'w-full py-2.5 rounded-xs text-sm font-semibold transition-all flex items-center justify-center gap-2',
            isProcessingQueue || queue.length === 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-foreground text-background hover:bg-foreground/90 shadow-xs'
          )}
        >
          {isProcessingQueue ? (
            <>
              <span className="icon-[ph--spinner] animate-spin size-4"></span> Committing...
            </>
          ) : (
            'Commit Changes'
          )}
        </button>
      </div>
    </div>
  )
}

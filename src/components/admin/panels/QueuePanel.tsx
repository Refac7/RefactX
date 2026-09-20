import { cn } from '~/lib/utils'
import { useAdmin } from '../AdminContext'

export default function QueuePanel() {
  const { mobileView, showRightPanel, queue, loadFromQueue, removeFromQueue, processQueue, isProcessingQueue } = useAdmin()

  return (
    <div
      className={cn(
        'flex-col bg-background/70 border border-primary/15 rounded-3xl  transition-all duration-300 relative overflow-hidden',
        mobileView === 'queue' ? 'flex h-[calc(100vh-12rem)] lg:h-auto' : 'hidden',
        showRightPanel ? 'lg:flex lg:col-span-3 xl:col-span-3' : 'lg:hidden'
      )}
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-primary/15 flex justify-between items-center bg-accent/40">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
            Q
          </span>
          <span className="text-sm font-bold text-foreground">修改队列 📦</span>
        </div>
        <span className="text-[10px] font-bold text-primary bg-background border border-primary/20 rounded-full px-2 py-0.5">
          {queue.length}
        </span>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="icon-[ph--check-circle] size-8 mb-3 text-primary/30" />
            <span className="text-[10px] font-bold">没有待处理的修改 ✨</span>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="relative bg-background border border-primary/15 rounded-2xl p-3 flex flex-col gap-2 group hover:border-primary/40  transition-all"
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase px-2 py-0.5 rounded-full',
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
                      className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <span className="icon-[ph--pencil-simple] size-3.5" />
                    </button>
                  )}
                  {item.status === 'pending' && (
                    <button
                      onClick={(e) => removeFromQueue(item.id, e)}
                      className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                      title="Remove"
                    >
                      <span className="icon-[ph--x] size-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold truncate text-foreground" title={item.filename}>
                  {item.filename.split('/').pop()}
                </div>
                {item.status !== 'pending' && (
                  <div
                    className={cn(
                      'text-[10px] mt-1 font-bold',
                      item.status === 'done' ? 'text-emerald-500' : 'text-yellow-500 animate-pulse'
                    )}
                  >
                    {item.status === 'done' ? '已完成 ✅' : '处理中… ⏳'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Commit button */}
      <div className="p-4 border-t border-primary/15 bg-accent/40">
        <button
          onClick={processQueue}
          disabled={isProcessingQueue || queue.length === 0}
          className={cn(
            'w-full py-2.5 rounded-2xl text-[10px] font-bold transition-all flex items-center justify-center gap-2',
            isProcessingQueue || queue.length === 0
              ? 'bg-background text-muted-foreground border border-primary/15 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90  '
          )}
        >
          {isProcessingQueue ? (
            <>
              <span className="icon-[ph--spinner] animate-spin size-4" /> 提交中…
            </>
          ) : (
            '提交修改 🚀'
          )}
        </button>
      </div>
    </div>
  )
}

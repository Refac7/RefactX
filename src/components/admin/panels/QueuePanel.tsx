import { cn } from '~/lib/utils';
import { useAdmin } from '../AdminContext';

export default function QueuePanel() {
  const { 
    mobileView, showRightPanel, queue, loadFromQueue, 
    removeFromQueue, processQueue, isProcessingQueue 
  } = useAdmin();

  return (
    <div className={cn(
        "flex-col border-t lg:border-t-0 lg:border-l border-border bg-muted/[0.02] transition-all duration-300 relative", 
        mobileView === 'queue' ? 'flex h-[60vh] lg:h-auto' : 'hidden',
        showRightPanel ? 'lg:flex lg:col-span-3' : 'lg:hidden'
    )}>
        <div className="h-10 px-3 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur sticky top-0 z-10">
          <span className="text-[10px] font-mono font-bold tracking-wider opacity-70 flex items-center gap-2">
              <span className="size-1.5 bg-yellow-500"></span> STAGING_AREA
          </span>
          <span className="text-[9px] font-mono text-muted-foreground bg-border/40 px-1.5 py-0.5">{queue.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 select-none">
                <span className="icon-[ph--queue] size-8 block mb-2 opacity-50"></span>
                <span className="text-[10px] font-mono uppercase tracking-widest">Buffer Clear</span>
              </div>
            ) : (
              queue.map(item => (
                <div key={item.id} className="relative bg-background border border-border p-3 flex flex-col gap-2 group hover:border-primary/40 transition-colors shadow-sm">
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", item.status === 'done' ? 'bg-emerald-500' : item.status === 'processing' ? 'bg-yellow-500 animate-pulse' : item.type === 'delete' ? 'bg-red-500' : 'bg-primary')}></div>
                    <div className="flex justify-between items-start pl-2">
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider border px-1", item.type === 'delete' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-primary/30 text-primary bg-primary/5')}>
                        {item.type === 'delete' ? 'DEL' : 'WRI'} : {item.isDataFile ? 'JSON' : 'MD'}
                      </span>
                      <div className="flex gap-1">
                        {item.type === 'write' && (
                            <button onClick={() => loadFromQueue(item)} className="hover:text-primary transition-colors" title="Edit">
                              <span className="icon-[ph--pencil-simple] size-3.5"></span>
                            </button>
                        )}
                        {item.status === 'pending' && (
                            <button onClick={(e)=>removeFromQueue(item.id, e)} className="hover:text-red-500 transition-colors" title="Drop">
                              <span className="icon-[ph--x] size-3.5"></span>
                            </button>
                        )}
                      </div>
                    </div>
                    <div className="pl-2">
                          <div className="text-xs font-mono font-bold truncate text-foreground" title={item.filename}>{item.filename.split('/').pop()}</div>
                    </div>
                </div>
              ))
            )}
        </div>
        
        <div className="p-4 border-t border-border bg-background">
          <button 
            onClick={processQueue} 
            disabled={isProcessingQueue || queue.length === 0} 
            className={cn(
              "w-full py-4 text-xs font-bold font-mono uppercase tracking-[0.2em] transition-all relative overflow-hidden group border",
              isProcessingQueue || queue.length === 0 
                ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50" 
                : "bg-foreground text-background border-foreground hover:bg-primary hover:text-white hover:border-primary"
            )}
          >
            {isProcessingQueue ? <span className="flex items-center justify-center gap-2"><span className="icon-[ph--spinner] animate-spin size-3"></span> PROCESSING</span> : `COMMIT_CHANGES`}
          </button>
        </div>
    </div>
  );
}
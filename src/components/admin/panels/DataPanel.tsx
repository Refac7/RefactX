import { cn } from '~/lib/utils';
import { useAdmin } from '../AdminContext';
import { DATA_FILES } from '../types';

export default function DataPanel() {
  const { 
    mobileView, showLeftPanel, handleNewPost, fetchRemoteFiles, 
    loadFile, filename, isLoadingFiles, remoteFiles, stageForDelete 
  } = useAdmin();

  return (
    <div className={cn(
        "flex-col border-b lg:border-b-0 lg:border-r border-border bg-muted/[0.02] transition-all duration-300 relative", 
        mobileView === 'files' ? 'flex h-[65vh] lg:h-auto' : 'hidden',
        showLeftPanel ? 'lg:flex lg:col-span-2' : 'lg:hidden'
    )}>
      <div className="h-10 px-3 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur sticky top-0 z-10">
          <span className="text-[10px] font-mono font-bold tracking-wider opacity-70 flex items-center gap-2">
              <span className="size-1.5 bg-foreground"></span> DATA_BANK
          </span>
          <div className="flex gap-2">
              <button onClick={handleNewPost} className="hover:text-primary transition-colors" title="New Post"><span className="icon-[ph--plus] size-4"></span></button>
              <button onClick={() => fetchRemoteFiles()} className="hover:text-primary transition-colors" title="Refresh"><span className="icon-[ph--arrows-clockwise] size-4"></span></button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <div className="px-3 py-2 bg-muted/10 border-b border-border/40 text-[9px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest">Config_Files</div>
          {DATA_FILES.map(f => (
              <div key={f.name} onClick={() => loadFile(f.name, true, f.path)} className={cn("group flex items-center justify-between text-xs px-3 py-2 border-b border-border/40 cursor-pointer transition-colors", filename === f.name ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/5 hover:text-foreground")}>
                  <div className="flex items-center gap-2 overflow-hidden">
                      <span className={cn("icon-[ph--brackets-curly] size-3 shrink-0", filename === f.name ? "text-primary" : "text-muted-foreground/50")}></span>
                      <span className="font-mono truncate uppercase tracking-tight">{f.label}</span>
                  </div>
              </div>
          ))}

          <div className="px-3 py-2 bg-muted/10 border-y border-border/40 text-[9px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest mt-4">Archive_Logs</div>
          {isLoadingFiles ? (
              <div className="p-4 text-center"><span className="icon-[ph--spinner] animate-spin text-primary size-4"></span></div>
          ) : remoteFiles.map(f => (
              <div key={f.sha} className={cn("group flex justify-between items-center text-xs px-3 py-2 border-b border-border/40 cursor-pointer transition-colors", filename === f.name ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/5 hover:text-foreground")}>
                  <span onClick={() => loadFile(f.name)} className="font-mono truncate flex-1">{f.name.replace('.md', '')}</span>
                  <button onClick={(e) => { e.stopPropagation(); stageForDelete(f); }} className="text-muted-foreground/30 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><span className="icon-[ph--trash] size-3.5"></span></button>
              </div>
          ))}
      </div>
    </div>
  );
}
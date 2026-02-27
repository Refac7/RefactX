import { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { cn } from '~/lib/utils';
import PostEditor from './PostEditor';
import JsonEditor from './JsonEditor';

export default function EditorPanel() {
  const { 
    mobileView, showLeftPanel, showRightPanel, setShowLeftPanel, setShowRightPanel,
    currentMode, editorMode, setEditorMode, filename, setFilename, 
    stageForWrite, isFetchingContent
  } = useAdmin();
  
  const [showPreview, setShowPreview] = useState(false);
  const [showMetaConfig, setShowMetaConfig] = useState(true);

  return (
    <div className={cn(
        "flex-col bg-background lg:flex transition-all duration-300 relative z-0", 
        mobileView === 'editor' ? 'flex h-[80vh] lg:h-auto' : 'hidden',
        showLeftPanel && showRightPanel ? "lg:col-span-7" : !showLeftPanel && showRightPanel ? "lg:col-span-9" : showLeftPanel && !showRightPanel ? "lg:col-span-10" : "lg:col-span-12"
    )}>
      <div className="h-10 flex justify-between items-center border-b border-border bg-background relative z-10 px-0">
          <div className="flex items-center h-full flex-1 min-w-0">
               <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="hidden lg:flex h-full w-8 items-center justify-center text-muted-foreground hover:text-primary border-r border-border hover:bg-muted/5 transition-colors">
                  <span className={cn("size-3.5 transition-transform", showLeftPanel ? "" : "rotate-180", "icon-[ph--caret-left]")}></span>
               </button>
               <div className="flex-1 flex items-center px-4 gap-2">
                    <span className={cn("size-3.5 text-primary", currentMode === 'data' ? "icon-[ph--brackets-curly]" : "icon-[ph--file-text]")}></span>
                    <input value={filename} onChange={e => setFilename(e.target.value)} disabled={currentMode === 'data'} placeholder="UNTITLED_FILE" className="bg-transparent text-xs font-mono font-bold w-full focus:outline-none tracking-wide placeholder:text-muted-foreground/30 text-foreground" />
               </div>
          </div>

          <div className="flex items-center h-full">
              {currentMode === 'post' ? (
                  <>
                    <button 
                        onClick={() => setShowPreview(!showPreview)} 
                        className={cn("h-full px-3 text-[10px] font-mono font-bold uppercase tracking-wider border-l border-border transition-colors flex items-center gap-2", showPreview ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/5 hover:text-primary")}
                    >
                        <span className={cn("size-3.5", showPreview ? "icon-[ph--eye-slash]" : "icon-[ph--eye]")}></span>
                        <span className="hidden sm:inline">PREVIEW</span>
                    </button>
                    <button 
                        disabled={showPreview}
                        onClick={() => setShowMetaConfig(!showMetaConfig)} 
                        className={cn(
                            "h-full px-3 border-l border-border transition-colors",
                            showPreview 
                                ? "opacity-30 cursor-not-allowed text-muted-foreground" 
                                : cn("text-muted-foreground hover:bg-primary/10 hover:text-primary", showMetaConfig && "text-primary bg-primary/5")
                        )}
                    >
                        <span className="icon-[ph--sliders-horizontal] size-3.5"></span>
                    </button>
                  </>
              ) : (
                 <button onClick={() => setEditorMode(editorMode === 'visual' ? 'raw' : 'visual')} className="h-full px-3 border-l border-border hover:bg-primary/10 text-[10px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                    {editorMode === 'visual' ? 'VISUAL' : 'CODE'}
                 </button>
              )}
              <button onClick={stageForWrite} className="h-full px-5 bg-primary text-primary-foreground text-[10px] font-mono font-bold hover:bg-primary/90 tracking-widest uppercase transition-all flex items-center gap-2">
                 <span className="icon-[ph--floppy-disk] size-3.5"></span> SAVE
              </button>
              <button onClick={() => setShowRightPanel(!showRightPanel)} className="hidden lg:flex h-full w-8 items-center justify-center text-muted-foreground hover:text-primary border-l border-border hover:bg-muted/5 transition-colors">
                  <span className={cn("size-3.5 transition-transform", showRightPanel ? "" : "rotate-180", "icon-[ph--caret-right]")}></span>
              </button>
          </div>
      </div>

      <div className="flex-1 relative w-full h-full min-h-[400px] flex flex-col overflow-hidden bg-background">
          {isFetchingContent && (
             <div className="absolute inset-0 bg-background/80 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                 <span className="icon-[ph--spinner] animate-spin size-8 text-primary"></span>
                 <span className="text-xs font-mono uppercase tracking-[0.3em] animate-pulse">Retrieving Data...</span>
             </div>
          )}
          
          {currentMode === 'post' ? (
              <PostEditor showPreview={showPreview} showMetaConfig={showMetaConfig} />
          ) : (
              <JsonEditor />
          )}
      </div>
    </div>
  );
}
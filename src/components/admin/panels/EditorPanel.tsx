import { useState } from 'react'
import { useAdmin } from '../AdminContext'
import { cn } from '~/lib/utils'
import PostEditor from './PostEditor'
import JsonEditor from './JsonEditor'

export default function EditorPanel() {
  const {
    mobileView,
    showLeftPanel,
    showRightPanel,
    setShowLeftPanel,
    setShowRightPanel,
    currentMode,
    editorMode,
    setEditorMode,
    filename,
    setFilename,
    stageForWrite,
    isFetchingContent,
  } = useAdmin()

  const [showPreview, setShowPreview] = useState(false)
  const [showMetaConfig, setShowMetaConfig] = useState(true)

  return (
    <div
      className={cn(
        'flex-col bg-background/70 border border-primary/15 rounded-3xl  lg:flex transition-all duration-300 relative overflow-hidden',
        mobileView === 'editor' ? 'flex h-[calc(100vh-12rem)] lg:h-auto' : 'hidden',
        showLeftPanel && showRightPanel
          ? 'lg:col-span-6 xl:col-span-7'
          : !showLeftPanel && showRightPanel
            ? 'lg:col-span-9'
            : showLeftPanel && !showRightPanel
              ? 'lg:col-span-9 xl:col-span-10'
              : 'lg:col-span-12'
      )}
    >
      {/* Toolbar */}
      <div className="h-12 flex justify-between items-center border-b border-primary/15 bg-accent/40 relative z-10 px-2 sm:px-4">
        <div className="flex items-center h-full flex-1 min-w-0">
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="hidden lg:flex p-1.5 mr-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
          >
            <span className={cn('size-4 transition-transform', showLeftPanel ? '' : 'rotate-180', 'icon-[ph--sidebar-simple]')} />
          </button>
          <div className="flex-1 flex items-center gap-2 max-w-sm">
            <span className={cn('size-4 text-primary', currentMode === 'data' ? 'icon-[ph--brackets-curly]' : 'icon-[ph--file-text]')} />
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={currentMode === 'data'}
              placeholder="Untitled Document"
              className="bg-transparent text-sm font-semibold w-full focus:outline-none placeholder:text-muted-foreground/40 text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {currentMode === 'post' ? (
            <>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-bold rounded-xl transition-colors flex items-center gap-1.5',
                  showPreview ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-primary'
                )}
              >
                <span className={cn('size-4', showPreview ? 'icon-[ph--eye-slash]' : 'icon-[ph--eye]')} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                disabled={showPreview}
                onClick={() => setShowMetaConfig(!showMetaConfig)}
                className={cn(
                  'px-2 py-0.5 rounded-lg transition-colors',
                  showPreview
                    ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                    : cn('text-muted-foreground hover:bg-accent hover:text-primary', showMetaConfig && 'bg-accent text-primary')
                )}
                title="Meta Settings"
              >
                <span className="icon-[ph--sliders-horizontal] size-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditorMode(editorMode === 'visual' ? 'raw' : 'visual')}
              className="px-3 py-1.5 text-[10px] font-bold bg-accent text-muted-foreground hover:text-primary rounded-xl transition-colors"
            >
              {editorMode === 'visual' ? 'Raw Code' : 'Visual Edit'}
            </button>
          )}

          <div className="h-4 w-px bg-primary/20 mx-1 hidden sm:block" />

          <button
            onClick={stageForWrite}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5  "
          >
            <span className="icon-[ph--floppy-disk] size-4" />
            <span className="hidden sm:inline">保存</span>
          </button>

          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="hidden lg:flex p-1.5 ml-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
          >
            <span className={cn('size-4 transition-transform', showRightPanel ? 'rotate-180' : '', 'icon-[ph--sidebar-simple]')} />
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 relative w-full h-full min-h-100 flex flex-col overflow-hidden bg-background">
        {isFetchingContent && (
          <div className="absolute inset-0 bg-background/60 z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
            <span className="icon-[ph--spinner] animate-spin size-6 text-primary" />
            <span className="text-[10px] font-bold text-primary/70">正在加载文件… ✨</span>
          </div>
        )}

        {currentMode === 'post' ? <PostEditor showPreview={showPreview} showMetaConfig={showMetaConfig} /> : <JsonEditor />}
      </div>
    </div>
  )
}

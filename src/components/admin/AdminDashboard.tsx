import { CMS_CONFIG } from '~/config'
import { cn } from '~/lib/utils'
import AdminProvider, { useAdmin } from './AdminContext'
import { REPO_CONFIG } from './types'
import LoginScreen from './LoginScreen'
import DataPanel from './panels/DataPanel'
import EditorPanel from './panels/EditorPanel'
import QueuePanel from './panels/QueuePanel'

const DashboardLayout = () => {
  const { isLoggedIn, username, fileInputRef, handleFileChange, mobileView, setMobileView, queue, remoteFiles, handleLogout } = useAdmin()

  if (!isLoggedIn) return <LoginScreen />

  return (
    <div className="text-foreground font-sans min-h-screen bg-muted/10 flex flex-col relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border/40 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto p-6 lg:p-8 xl:p-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 select-none">
              <div className="size-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="icon-[ph--terminal-window] size-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">RefactX CMS</h1>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">System Controller</span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-mono text-primary">
              {REPO_CONFIG.repo}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Online</span>
            </div>
            {username && (
              <>
                <div className="h-4 w-px bg-border/60 mx-1" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:inline">{username}</span>
              </>
            )}
            <div className="h-4 w-px bg-border/60 mx-1" />
            <button
              onClick={handleLogout}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 lg:p-8 xl:p-12 flex flex-col h-[calc(100vh-4rem)]">
        {/* Stats cards */}
        <div className="hidden lg:grid grid-cols-3 gap-6 mb-6 shrink-0">
          <div className="bg-background/50 border border-border/40 p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Total Files</p>
              <h3 className="text-2xl font-bold">{remoteFiles.length}</h3>
            </div>
            <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="icon-[ph--files] size-5 text-primary/70" />
            </div>
          </div>
          <div
            className="bg-background/50 border border-border/40 p-5 flex items-center justify-between cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
            onClick={() => setMobileView('queue')}
          >
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Pending Changes</p>
              <h3 className={cn('text-2xl font-bold', queue.length > 0 ? 'text-primary' : 'text-foreground')}>{queue.length}</h3>
            </div>
            <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className={cn('size-5', queue.length > 0 ? 'text-primary' : 'text-primary/50', 'icon-[ph--queue]')} />
            </div>
          </div>
          <div className="bg-background/50 border border-border/40 p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Repository</p>
              <h3 className="text-sm font-bold truncate max-w-50">{REPO_CONFIG.repo}</h3>
            </div>
            <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="icon-[ph--git-branch] size-5 text-primary/70" />
            </div>
          </div>
        </div>

        {/* Mobile tab nav */}
        <div className="grid grid-cols-3 mb-4 bg-background/50 border border-border/40 p-1 lg:hidden shrink-0">
          {['files', 'editor', 'queue'].map((v) => (
            <button
              key={v}
              onClick={() => setMobileView(v as any)}
              className={cn(
                'py-2 text-[10px] font-mono uppercase tracking-widest transition-all',
                mobileView === v ? 'bg-muted text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'queue' && queue.length > 0 ? `Queue (${queue.length})` : v}
            </button>
          ))}
        </div>

        {/* Editor panels */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0 relative">
          <DataPanel />
          <EditorPanel />
          <QueuePanel />
        </div>
      </main>
    </div>
  )
}

export default function AdminDashboard() {
  if (!CMS_CONFIG.enableCMS) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-muted-foreground bg-muted/10">
        <div className="flex flex-col items-center gap-4">
          <span className="icon-[ph--prohibit] size-10 text-muted-foreground/30" />
          <p className="text-sm font-mono text-muted-foreground/50 uppercase tracking-widest">CMS is currently disabled.</p>
        </div>
      </div>
    )
  }

  return (
    <AdminProvider>
      <DashboardLayout />
    </AdminProvider>
  )
}

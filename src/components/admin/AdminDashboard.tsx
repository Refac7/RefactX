import { useEffect } from 'react'
import { CMS_CONFIG } from '~/config'
import { cn } from '~/lib/utils'
import AdminProvider, { useAdmin } from './AdminContext'
import { REPO_CONFIG } from './types'
import LoginScreen from './LoginScreen'
import DataPanel from './panels/DataPanel'
import EditorPanel from './panels/EditorPanel'
import QueuePanel from './panels/QueuePanel'

const DashboardLayout = () => {
  const { isLoggedIn, fileInputRef, handleFileChange, mobileView, setMobileView, queue, remoteFiles, handleLogout } = useAdmin()

  // 登录后隐藏 Astro 渲染的左侧 PageAside，使 CMS 面板占满全宽
  useEffect(() => {
    document.documentElement.classList.toggle('is-authed', isLoggedIn)
  }, [isLoggedIn])

  if (!isLoggedIn) return <LoginScreen />

  return (
    <div className="text-foreground font-sans min-h-screen bg-muted/10 flex flex-col relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Main workspace */}
      <main className="flex-1 px-6 lg:px-8 xl:px-12 py-6 lg:py-8 xl:py-12 flex flex-col min-h-screen">
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

      {/* Floating logout */}
      <button
        onClick={handleLogout}
        title="Sign Out"
        className="fixed bottom-5 right-5 z-30 flex items-center justify-center size-10 bg-background/90 backdrop-blur-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 shadow-sm hover:shadow-md rounded-full transition-all"
      >
        <span className="icon-[ph--sign-out] size-4" />
      </button>
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

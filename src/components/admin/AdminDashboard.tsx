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
  const { isLoggedIn, username, fileInputRef, handleFileChange, mobileView, setMobileView, queue, remoteFiles, handleLogout } = useAdmin()

  // 登录后隐藏 Astro 渲染的左侧 PageAside，使 CMS 面板占满全宽
  useEffect(() => {
    document.documentElement.classList.toggle('is-authed', isLoggedIn)
  }, [isLoggedIn])

  if (!isLoggedIn) return <LoginScreen />

  return (
    <div className="text-foreground font-sans min-h-screen bg-accent/30 flex flex-col relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Header */}
      <header className="bg-background/85 backdrop-blur-xl border-b border-primary/15">
        <div className="px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 select-none">
              <div className="size-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary  ">
                <span className="icon-[ph--sparkle-duotone] size-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">RefactX CMS 🐾</h1>
                <span className="text-[10px] text-primary/70 font-medium">可爱管理面板</span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {REPO_CONFIG.repo}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-primary" />
              </span>
              <span className="text-[10px] font-bold text-primary/70">在线中 ✨</span>
            </div>
            {username && (
              <>
                <div className="h-4 w-px bg-primary/20 mx-1" />
                <span className="text-[10px] font-bold text-primary/70 hidden sm:inline">{username}</span>
              </>
            )}
            <div className="h-4 w-px bg-primary/20 mx-1" />
            <button
              onClick={handleLogout}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-accent"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 px-6 lg:px-8 xl:px-12 py-6 lg:py-8 xl:py-12 flex flex-col h-[calc(100vh-4rem)]">
        {/* Stats cards */}
        <div className="hidden lg:grid grid-cols-3 gap-6 mb-6 shrink-0">
          <div className="bg-background/70 border border-primary/15 rounded-3xl  p-5 flex items-center justify-between hover:border-primary/40  transition-all">
            <div>
              <p className="text-[10px] font-bold text-primary/60 mb-1">文件总数</p>
              <h3 className="text-2xl font-extrabold">{remoteFiles.length}</h3>
            </div>
            <div className="size-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span className="icon-[ph--files] size-5 text-primary" />
            </div>
          </div>
          <div
            className="bg-background/70 border border-primary/15 rounded-3xl  p-5 flex items-center justify-between cursor-pointer hover:border-primary/40  transition-all"
            onClick={() => setMobileView('queue')}
          >
            <div>
              <p className="text-[10px] font-bold text-primary/60 mb-1">待提交修改</p>
              <h3 className={cn('text-2xl font-extrabold', queue.length > 0 ? 'text-primary' : 'text-foreground')}>{queue.length}</h3>
            </div>
            <div className="size-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span className={cn('size-5', queue.length > 0 ? 'text-primary' : 'text-primary/50', 'icon-[ph--queue]')} />
            </div>
          </div>
          <div className="bg-background/70 border border-primary/15 rounded-3xl  p-5 flex items-center justify-between hover:border-primary/40  transition-all">
            <div>
              <p className="text-[10px] font-bold text-primary/60 mb-1">仓库</p>
              <h3 className="text-sm font-bold truncate max-w-50">{REPO_CONFIG.repo}</h3>
            </div>
            <div className="size-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span className="icon-[ph--git-branch] size-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Mobile tab nav */}
        <div className="grid grid-cols-3 mb-4 bg-background/70 border border-primary/15 rounded-2xl p-1 lg:hidden shrink-0">
          {['files', 'editor', 'queue'].map((v) => (
            <button
              key={v}
              onClick={() => setMobileView(v as any)}
              className={cn(
                'py-2 text-[10px] font-bold transition-all rounded-xl',
                mobileView === v ? 'bg-primary text-primary-foreground  ' : 'text-muted-foreground hover:text-primary'
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

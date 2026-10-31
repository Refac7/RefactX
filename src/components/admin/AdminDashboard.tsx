import { useEffect } from 'react'
import { CMS_CONFIG } from '~/config'
import { cn } from '~/lib/utils'
import AdminProvider, { useAdmin } from './AdminContext'
import { REPO_CONFIG } from './types'
import LoginScreen from './LoginScreen'
import DataPanel from './panels/DataPanel'
import EditorPanel from './panels/EditorPanel'
import QueuePanel from './panels/QueuePanel'

const MOBILE_TABS = [
  { id: 'files', label: '内容', icon: 'icon-[ph--folder-open]' },
  { id: 'editor', label: '编辑器', icon: 'icon-[ph--pencil-simple]' },
  { id: 'queue', label: '队列', icon: 'icon-[ph--queue]' },
] as const

const DashboardLayout = () => {
  const { isLoggedIn, fileInputRef, handleFileChange, mobileView, setMobileView, queue, remoteFiles, username, handleLogout } = useAdmin()

  // 登录后隐藏 Astro 渲染的左侧 PageAside，使 CMS 面板占满全宽
  useEffect(() => {
    document.documentElement.classList.toggle('is-authed', isLoggedIn)
  }, [isLoggedIn])

  if (!isLoggedIn) return <LoginScreen />

  return (
    <div className="text-foreground font-sans pb-16">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <div className="container-page py-10 sm:py-12">
        <div className="reveal-header flex flex-col gap-6 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow eyebrow-dot">CMS Workspace</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">内容控制台</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              编辑文章、维护站点数据，并将改动一次性提交到 GitHub。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="chip">
              <span className="icon-[ph--user-circle] size-3.5" />
              {username || 'admin'}
            </span>
            <button type="button" onClick={handleLogout} className="btn btn-ghost">
              退出登录
              <span className="icon-[ph--sign-out] size-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="surface flex items-center justify-between p-5">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">内容文件</p>
              <h3 className="mt-1 font-display text-3xl font-bold tracking-tight">{remoteFiles.length}</h3>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">
              <span className="icon-[ph--files] size-5" />
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileView('queue')}
            className="surface flex items-center justify-between p-5 text-left transition-colors hover:border-primary/35"
          >
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">待提交改动</p>
              <h3 className={cn('mt-1 font-display text-3xl font-bold tracking-tight', queue.length > 0 && 'text-primary')}>
                {queue.length}
              </h3>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">
              <span className="icon-[ph--queue] size-5" />
            </span>
          </button>

          <div className="surface flex items-center justify-between p-5">
            <div className="min-w-0">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">当前仓库</p>
              <h3 className="mt-1 truncate font-display text-xl font-bold tracking-tight">{REPO_CONFIG.repo}</h3>
              <p className="mt-1 truncate font-mono text-[0.6rem] text-muted-foreground">
                {REPO_CONFIG.owner} / {REPO_CONFIG.branch}
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
              <span className="icon-[ph--git-branch] size-5" />
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-1 rounded-full border border-border/70 bg-card p-1 lg:hidden">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileView(tab.id)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition-colors',
                mobileView === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn('size-3.5', tab.icon)} />
              {tab.label}
              {tab.id === 'queue' && queue.length > 0 && (
                <span className="rounded-full bg-black/10 px-1.5 text-[0.6rem]">{queue.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-5">
          <DataPanel />
          <EditorPanel />
          <QueuePanel />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  if (!CMS_CONFIG.enableCMS) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-20 text-center text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <span className="icon-[ph--prohibit] size-10 text-muted-foreground/30" />
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground/50">CMS is currently disabled.</p>
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

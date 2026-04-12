import { CMS_CONFIG } from '~/config';
import { cn } from '~/lib/utils';
import AdminProvider, { useAdmin } from './AdminContext';
import { REPO_CONFIG } from './types';
import LoginScreen from './LoginScreen';
import DataPanel from './panels/DataPanel';
import EditorPanel from './panels/EditorPanel';
import QueuePanel from './panels/QueuePanel';

// 内部组件：仪表盘布局
const DashboardLayout = () => {
  const { isLoggedIn, fileInputRef, handleFileChange, mobileView, setMobileView, queue, remoteFiles, handleLogout } = useAdmin();

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <div className="text-foreground font-sans min-h-screen bg-muted/10 flex flex-col relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      
      {/* 现代化的 Header */}
      <header className="bg-background border-b border-border/40 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto p-6 lg:p-8 xl:p-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight">RefactX CMS</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-muted/50 border border-border/40 text-xs font-medium text-muted-foreground">
              {REPO_CONFIG.repo}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-muted-foreground">Online</span>
            </div>
            <div className="h-4 w-px bg-border/60 mx-1"></div>
            <button 
              onClick={handleLogout} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 主工作区 */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 lg:p-8 xl:p-12 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* 指标状态区 (仅桌面端显示) */}
        <div className="hidden lg:grid grid-cols-3 gap-6 mb-6 shrink-0">
          <div className="bg-background rounded-lg border border-border/40 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Files</p>
              <h3 className="text-2xl font-bold">{remoteFiles.length}</h3>
            </div>
            <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
              <span className="icon-[ph--files] size-5 text-muted-foreground"></span>
            </div>
          </div>
          <div className="bg-background rounded-lg border border-border/40 p-5 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setMobileView('queue')}>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Changes</p>
              <h3 className={cn("text-2xl font-bold", queue.length > 0 ? "text-primary" : "text-foreground")}>{queue.length}</h3>
            </div>
            <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
              <span className="icon-[ph--queue] size-5 text-muted-foreground"></span>
            </div>
          </div>
          <div className="bg-background rounded-lg border border-border/40 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Repository</p>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{REPO_CONFIG.repo}</h3>
            </div>
            <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
              <span className="icon-[ph--git-branch] size-5 text-muted-foreground"></span>
            </div>
          </div>
        </div>

        {/* 移动端标签页导航 */}
        <div className="grid grid-cols-3 mb-4 bg-background rounded-xs border border-border/40 p-1 lg:hidden shrink-0">
            {['files', 'editor', 'queue'].map(v => (
                <button 
                  key={v} 
                  onClick={() => setMobileView(v as any)} 
                  className={cn(
                    "py-2 text-xs font-medium rounded-xs capitalize transition-all", 
                    mobileView === v 
                      ? 'bg-muted text-foreground shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v === 'queue' && queue.length > 0 ? `Queue (${queue.length})` : v}
                </button>
            ))}
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0 relative">
            <DataPanel />
            <EditorPanel />
            <QueuePanel />
        </div>
      </main>
    </div>
  );
};

export default function AdminDashboard() {
  if (!CMS_CONFIG.enableCMS) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-muted-foreground bg-muted/10">
        <p className="text-sm font-medium">CMS is currently disabled.</p>
      </div>
    );
  }

  return (
    <AdminProvider>
      <DashboardLayout />
    </AdminProvider>
  );
}
import { Toaster } from 'react-hot-toast';
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
    <div className="text-foreground font-sans min-h-screen flex flex-col relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      
      {/* Hero Header */}
      <div className="relative z-10 border-b border-border/60 bg-background">
          <div className="mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 p-6 sm:p-8">
                <div className="lg:col-span-8 lg:border-r border-border/60 flex flex-col justify-between min-h-[360px]">
                     <div className="flex justify-between items-start mb-8 lg:pr-12 select-none">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">// SYS_ADMIN // V.3.5</span>
                        <div className="flex items-center gap-2">
                            <div className="flex relative h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-600"></span>
                            </div>
                            <span className="font-mono text-[10px] uppercase text-foreground font-bold tracking-wider">SYS: ONLINE</span>
                        </div>
                     </div>
                     <div>
                        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.85] text-foreground -ml-1 select-none">CONSOLE<span className="text-primary">.</span></h1>
                        <div className="mt-6 flex flex-col gap-2">
                            <div className="h-1 w-12 bg-foreground/10"></div>
                            <p className="text-lg sm:text-xl text-muted-foreground font-light max-w-xl leading-relaxed">
                                Administrator Mode Active.<br/>
                                <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Full write access granted to repository.</span>
                            </p>
                        </div>
                     </div>
                </div>
                <div className="lg:col-span-4 flex flex-col border-l-2 lg:border-l-0 border-l-foreground border-t lg:border-t-0 border-border/60">
                    <div className="flex-1 p-6 sm:p-8 bg-muted/5 border-b border-border/60 lg:border-b border-none xl:border-dashed flex flex-col">
                        <span className="block text-[10px] font-mono uppercase text-muted-foreground/60 tracking-wider mb-4">// CURRENT_SESSION</span>
                        <div className="flex-1 space-y-6">
                            <div>
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-mono block mb-1">Target_Repo</span>
                                <span className="font-mono text-xs text-foreground break-all bg-background border border-border px-2 py-1 inline-block">{REPO_CONFIG.repo}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-mono border-l-2 border-primary/20 pl-3">RefactX Control Panel.<br/>Centralized content management system.</p>
                        </div>
                        <div className="mt-8 pt-4 border-t border-dashed border-border/40">
                            <button onClick={handleLogout} className="group w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors">
                                <span>Terminate_Session</span><span className="icon-[ph--sign-out] size-4 group-hover:translate-x-1 transition-transform"></span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 bg-border/60 gap-px border-t border-border/60 lg:border-t-0">
                        <div className="bg-background p-6 flex flex-col items-center justify-center h-32 hover:bg-muted/5 transition-colors group relative">
                            <span className="text-3xl font-mono font-bold text-foreground group-hover:text-primary transition-colors tracking-tighter">{remoteFiles.length.toString().padStart(2, '0')}</span>
                            <span className="text-[9px] font-mono uppercase text-muted-foreground mt-2 tracking-widest">Total_Modules</span>
                        </div>
                        <div className="bg-background p-6 flex flex-col items-center justify-center h-32 hover:bg-muted/5 transition-colors group relative cursor-pointer" onClick={() => setMobileView('queue')}>
                             <span className={cn("text-3xl font-mono font-bold tracking-tighter transition-colors", queue.length > 0 ? "text-primary animate-pulse" : "text-foreground")}>{queue.length.toString().padStart(2, '0')}</span>
                             <span className="text-[9px] font-mono uppercase text-muted-foreground mt-2 tracking-widest">Buffer_Tasks</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>

      <div className="mx-6 md:mx-8 flex-1 flex flex-col lg:grid lg:grid-cols-12 relative border-x border-border/60 bg-background/90">
          <div className="grid grid-cols-3 border-b border-border lg:hidden bg-background">
              {['files', 'editor', 'queue'].map(v => (
                 <button key={v} onClick={() => setMobileView(v as any)} className={cn("py-3 text-[10px] tracking-widest uppercase font-mono border-r last:border-r-0 border-border hover:bg-muted/5 focus:outline-none rounded-none", mobileView === v ? 'bg-primary/10 text-primary font-bold shadow-[inset_0_-2px_0_0_rgba(var(--primary))]' : 'text-muted-foreground')}>
                   {v === 'files' ? 'DATA' : v === 'queue' ? `BUFFER [${queue.length}]` : v}
                 </button>
              ))}
          </div>
          <DataPanel />
          <EditorPanel />
          <QueuePanel />
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  if (!CMS_CONFIG.enableCMS) {
    return <div className="min-h-screen flex items-center justify-center text-center text-muted-foreground font-mono text-sm"><p>// SYSTEM_OFFLINE // CMS DISABLED</p></div>;
  }

  return (
    <AdminProvider>
      <Toaster 
        position="top-left" 
        toastOptions={{ 
          duration: 2000,
          style: { background: '#111', color: '#fff', marginTop: '100px', marginLeft: '10px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '12px', borderRadius: '0' }
        }} 
      />
      <DashboardLayout />
    </AdminProvider>
  );
}
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// 这里不需要 Token 了，只需要仓库信息
const REPO_CONFIG = {
  owner: 'YOUR_GITHUB_USERNAME', 
  repo: 'YOUR_REPO_NAME',
  branch: 'main',
  pathPrefix: 'src/content/posts/' 
};

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('---\ntitle: New Post\n---\n\nWrite here...');
  const [isPublishing, setIsPublishing] = useState(false);

  // 检查本地是否有保存的简单密码
  useEffect(() => {
    const savedPass = localStorage.getItem('admin_simple_pass');
    if (savedPass) {
      setPassword(savedPass);
      setIsLoggedIn(true); // 自动进入，稍后发布时 API 还会校验一次
      loadDraft();
    }
  }, []);

  const handleLogin = () => {
    if (!password) return toast.error('Password required');
    localStorage.setItem('admin_simple_pass', password);
    setIsLoggedIn(true);
    toast.success('Session Active');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_simple_pass');
    setPassword('');
    setIsLoggedIn(false);
  };

  const saveDraft = () => {
    localStorage.setItem('admin_draft', JSON.stringify({ filename, content }));
    toast.success('Draft Saved');
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('admin_draft');
    if (draft) {
      const d = JSON.parse(draft);
      setFilename(d.filename);
      setContent(d.content);
    }
  };

  // --- 核心修改：调用 API 而不是直接调用 GitHub ---
  const handlePublish = async () => {
    if (!filename || !content) return toast.error('Missing fields');
    
    setIsPublishing(true);
    const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password, // 发送密码给服务器验证
          filename: finalFilename,
          content: content,
          config: REPO_CONFIG
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast.success('Published! Build triggered.');
      localStorage.removeItem('admin_draft');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
      // 如果是密码错误，强制退出
      if (error.message.includes('Access Denied')) {
        handleLogout();
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // --- 登录界面 ---
  if (!isLoggedIn) {
    return (
      <div className="max-w-[1400px] mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Toaster />
        <div className="w-full max-w-md border border-border/60 bg-background p-8 relative overflow-hidden group">
           <span className="absolute -right-4 -top-6 text-[100px] font-black text-muted-foreground/[0.03] font-mono select-none">Auth</span>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-6">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Access</h2>
             </div>
             <input 
                type="password" 
                className="w-full bg-muted/20 border border-border/50 p-3 font-mono text-sm focus:border-primary/50 focus:outline-none transition-colors mb-4"
                placeholder="ENTER PASSWORD..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
             />
             <button onClick={handleLogin} className="w-full bg-primary text-primary-foreground py-2 font-mono text-sm uppercase tracking-wider hover:opacity-90">
                Unlock
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- 主界面 (复刻 Project 页面风格) ---
  return (
    <div className="min-h-[70vh] relative py-12 px-6 sm:px-8 font-sans overflow-hidden max-w-[1400px] mx-auto">
      <Toaster 
        toastOptions={{
            style: { background: '#333', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' }
        }}
      />

      {/* 头部区域：Grid 布局 */}
      <div className="mb-10 relative">
        <div className="flex items-center justify-between pb-2 mb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
             // SYSTEM_CONTROLLER // {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-2 cursor-pointer hover:text-red-500 transition-colors" onClick={handleLogout} title="Terminate Session">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[10px] uppercase text-emerald-500 font-bold">Admin_Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* 左侧：标题 */}
          <div className="lg:col-span-7">
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter text-foreground leading-[0.9] -ml-1">
              Control<span className="text-primary/80">.</span>
            </h1>
          </div>

          {/* 右侧：状态面板 */}
          <div className="lg:col-span-5 flex flex-col justify-end pb-2">
            <div className="border-l-2 border-primary/40 pl-6 flex flex-col gap-6">
               <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Direct access to repository content. Changes deploy automatically via Vercel Webhook.
               </p>
               <div className="flex items-center gap-4 pt-4 border-t border-dashed border-border/60">
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">Target Branch</span>
                      <span className="text-xl font-mono font-bold text-foreground tracking-tight">
                          {REPO_CONFIG.branch}
                      </span>
                  </div>
                  <div className="h-8 w-px bg-border/60"></div>
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">Path Prefix</span>
                      <span className="text-sm font-mono text-foreground mt-1 truncate max-w-[150px]" title={REPO_CONFIG.pathPrefix}>
                          {REPO_CONFIG.pathPrefix}
                      </span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分割线 */}
      <div className="flex items-end gap-4 mb-10 select-none">
         <span className="font-mono text-4xl font-black text-muted-foreground/10 leading-none -mb-1">01</span>
         <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
            Editor_Interface
         </span>
         <div className="h-px bg-gradient-to-r from-border to-transparent flex-1 mb-1.5"></div>
      </div>

      {/* 编辑区域：复刻 Project Card 样式 */}
      <div className="group relative flex flex-col bg-background border border-border/60 hover:border-primary/30 transition-all duration-500 p-0 overflow-hidden shadow-sm">
        
        {/* 背景装饰 */}
        <span className="absolute -right-4 -top-6 text-[120px] font-black text-muted-foreground/[0.03] pointer-events-none select-none font-mono">
          EDIT
        </span>

        {/* 工具栏 */}
        <div className="flex justify-between items-center p-4 border-b border-border/40 bg-muted/5 relative z-10">
          <div className="flex gap-4 w-full max-w-md">
             <div className="flex items-center gap-2 text-muted-foreground">
                <span className="icon-[ph--file-text] size-5"></span>
             </div>
             <input 
                type="text" 
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="filename-slug.md"
                className="bg-transparent border-b border-transparent focus:border-primary/50 text-foreground font-mono text-sm w-full focus:outline-none pb-1 placeholder:text-muted-foreground/50"
             />
          </div>
          <div className="flex gap-3">
             <button 
                onClick={saveDraft}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Save Draft"
             >
                <span className="icon-[ph--floppy-disk] size-5"></span>
             </button>
             <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all text-xs font-mono uppercase tracking-wider disabled:opacity-50"
             >
                {isPublishing ? (
                    <>
                       <span className="animate-spin size-3 border-2 border-current border-t-transparent rounded-full"></span>
                       <span>Pushing...</span>
                    </>
                ) : (
                    <>
                       <span className="icon-[ph--upload-simple-bold] size-3"></span>
                       <span>Deploy</span>
                    </>
                )}
             </button>
          </div>
        </div>

        {/* 内容编辑区 */}
        <div className="relative z-10 flex-1 min-h-[500px]">
           <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-6 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none text-foreground/90 selection:bg-primary/20"
              spellCheck={false}
           />
        </div>

        {/* 底部信息栏 */}
        <div className="mt-auto px-6 py-3 border-t border-dashed border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider relative z-10 bg-muted/5">
           <span>Length: {content.length} chars</span>
           <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary/50"></span>
              <span>Ready to push</span>
           </div>
        </div>

      </div>
    </div>
  );
}
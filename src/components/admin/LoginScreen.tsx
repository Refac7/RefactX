import { useState } from 'react';
import { cn } from '~/lib/utils';
import { useAdmin } from './AdminContext';

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin();
  const [password, setPassword] = useState('');

  const handleKeyDown = (e: { key: string; }) => {
    if (e.key === 'Enter') {
      performLogin(password);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground font-mono overflow-hidden">
      
      {/* 左侧：视觉装饰区 */}
      <div className="relative w-full md:w-1/2 h-[30vh] md:h-auto bg-muted/10 border-b md:border-b-0 md:border-r border-border p-8 md:p-12 flex flex-col justify-between overflow-hidden select-none">
        
        {/* 背景装饰网格 */}
        <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
                backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', 
                backgroundSize: '32px 32px' 
            }}
        />

        {/* 顶部状态标 */}
        <div className="relative z-10 flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest">
            <div className={cn("size-2 rounded-full", loginError ? "bg-red-500 animate-pulse" : "bg-primary")}></div>
            <span>System Status: {loginError ? 'ALERT' : 'LOCKED'}</span>
        </div>

        {/* 主要标题文字 */}
        <div className="relative z-10 mt-4 md:mt-0">
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] opacity-90 mb-4">
                Identity<br/>Core_V3
            </h1>
            <div className="border-l-2 border-primary pl-4 py-1">
                <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em]">
                    Restricted Access Area
                </p>
                <p className="text-[10px] text-muted-foreground/60 uppercase mt-1">
                    Auth_Protocol: SHA-256
                </p>
            </div>
        </div>

        {/* 底部装饰信息 (仅桌面显示) */}
        <div className="relative z-10 hidden md:flex justify-between items-end text-[9px] text-muted-foreground/40 font-bold">
            <div className="flex flex-col">
                <span>SECURE_GATEWAY</span>
                <span>NODE: 099-AX</span>
            </div>
            <div className="text-right">
                UNAUTHORIZED ACCESS<br/>WILL BE LOGGED
            </div>
        </div>
      </div>

      {/* 右侧：交互表单区 */}
      <div className="w-full md:w-1/2 flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-card/50">
         
         {/* 装饰：右上角ID */}
         <div className="absolute top-4 right-4 md:top-8 md:right-8 text-[9px] font-bold text-muted-foreground border border-border px-2 py-1 opacity-50">
             TERMINAL_ID: T-800
         </div>

         <div className="w-full max-w-sm space-y-10">
            
            {/* 移动端显示的简略标题 */}
            <div className="md:hidden border-l-4 border-primary pl-3">
                 <h2 className="text-xl font-bold uppercase tracking-tight">Admin Login</h2>
            </div>

            <div className="space-y-8">
                {/* 输入框组 */}
                <div className="space-y-2 group">
                    <div className="flex justify-between items-end">
                         <label className="text-[10px] font-bold bg-foreground/5 px-2 py-0.5 text-muted-foreground">PASSKEY INPUT</label>
                         {isValidating && <span className="text-[9px] animate-pulse text-primary">VERIFYING...</span>}
                    </div>
                    
                    <div className="relative">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isValidating}
                            placeholder="••••••"
                            autoFocus
                            className={cn(
                                "w-full bg-background border-2 p-4 text-center text-xl md:text-2xl tracking-[0.5em] font-mono transition-all duration-300 outline-none placeholder:tracking-widest",
                                loginError 
                                    ? "border-red-500 text-red-500 placeholder:text-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                                    : "border-border focus:border-primary text-foreground placeholder:text-muted-foreground/20 focus:shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                            )}
                        />
                        {/* 角落装饰 */}
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-foreground opacity-20 group-focus-within:opacity-100 group-focus-within:border-primary transition-all"></div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-foreground opacity-20 group-focus-within:opacity-100 group-focus-within:border-primary transition-all"></div>
                    </div>
                </div>

                {/* 提交按钮 */}
                <button 
                    onClick={() => performLogin(password)} 
                    disabled={isValidating}
                    className={cn(
                        "w-full py-5 text-sm font-bold uppercase tracking-[0.2em] border-2 transition-all relative overflow-hidden group",
                        loginError
                            ? "border-red-500 text-red-500 hover:bg-red-500/10 cursor-not-allowed"
                            : "border-foreground bg-foreground text-background hover:bg-primary hover:border-primary hover:text-white dark:hover:text-black"
                    )}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2 transition-all">
                        {isValidating ? 'Processing...' : 'Establish Link'}
                        {!isValidating && <span className="hidden group-hover:inline-block transition-transform group-hover:translate-x-1">-{'>'}</span>}
                    </span>
                </button>
            </div>

            {/* 错误提示 / 状态栏 */}
            <div className="h-8 flex items-center justify-center">
                {loginError ? (
                    <div className="flex items-center gap-2 text-[10px] text-red-500 bg-red-500/5 px-3 py-1 border border-red-500/20 uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2">
                        <span className="icon-[mdi--alert-circle-outline] size-3"></span>
                        <span>Error: Credentials Rejected</span>
                    </div>
                ) : (
                    <span className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.3em]">
                        Waiting for input...
                    </span>
                )}
            </div>

         </div>

         {/* 底部版权/版本 */}
         <div className="absolute bottom-4 text-[9px] text-muted-foreground/20 uppercase tracking-widest">
            Sys.Ver.3.5.0 // © 2024
         </div>
      </div>
    </div>
  );
}
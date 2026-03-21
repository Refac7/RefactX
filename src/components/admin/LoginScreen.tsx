import { useState } from 'react';
import { cn } from '~/lib/utils';
import { useAdmin } from './AdminContext';

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin();
  const [password, setPassword] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') performLogin(password);
  };

  return (
    <div className="relative font-sans flex flex-col lg:flex-row min-h-screen max-w-[1920px] mx-auto text-foreground overflow-hidden">
      
      <aside className="w-full lg:w-1/3 flex flex-col lg:sticky lg:top-0 lg:h-screen border-b lg:border-b-0 lg:border-r z-20 bg-muted/5 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] dark:shadow-none select-none">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="flex-1 lg:overflow-y-auto scrollbar-hide flex flex-col relative z-10">
          <div className="p-6 lg:p-8 xl:p-12 pb-0 shrink-0">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              <div className={cn("size-2 rounded-none", loginError ? "bg-red-500 animate-pulse" : "bg-primary")}></div>
              <span>System Status: {loginError ? 'ALERT' : 'LOCKED'}</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end lg:justify-center p-6 lg:p-8 xl:p-12 min-h-[300px] lg:min-h-[250px]">
              <h1 className="text-6xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.85] opacity-90 mb-6 -ml-1">Identity<br/>Core<span className="text-primary">.</span></h1>
              <div className="border-l-2 border-primary pl-4 py-1">
                <p className="text-xs lg:text-sm text-muted-foreground uppercase tracking-[0.2em] font-mono">Restricted Access Area</p>
                <p className="text-[10px] text-muted-foreground/60 uppercase mt-2 font-mono">Auth_Protocol: SHA-256</p>
              </div>
          </div>
          
          <div className="shrink-0 p-6 lg:p-8 xl:p-12 border-t border-dashed hidden sm:block">
            <div className="flex justify-between items-end text-[9px] text-muted-foreground/40 font-bold font-mono">
              <div className="flex flex-col gap-1"><span>SECURE_GATEWAY</span><span>NODE: 099-AX</span></div>
              <div className="text-right">UNAUTHORIZED ACCESS<br/>WILL BE LOGGED</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="w-full lg:w-2/3 flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-background">
         <div className="absolute top-4 right-4 md:top-8 md:right-8 text-[9px] font-bold text-muted-foreground border px-2 py-1 opacity-50 font-mono select-none hidden sm:block">TERMINAL_ID: T-800</div>
         <div className="w-full max-w-sm space-y-10 z-10 mt-12 lg:mt-0">
            <div className="space-y-8">
                <div className="space-y-2 group">
                    <div className="flex justify-between items-end font-mono"><label className="text-[10px] font-bold bg-muted px-2 py-0.5 text-muted-foreground uppercase tracking-widest">PASSKEY INPUT</label>{isValidating && <span className="text-[9px] animate-pulse text-primary tracking-widest">VERIFYING...</span>}</div>
                    <div className="relative">
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} disabled={isValidating} placeholder="••••••" autoFocus className={cn("w-full bg-background border p-5 text-center text-xl md:text-2xl tracking-[0.5em] font-mono transition-all duration-300 outline-none placeholder:tracking-widest rounded-none", loginError ? "border-red-500/50 text-red-500 placeholder:text-red-500/20 bg-red-500/5" : "focus:border-primary/50 text-foreground placeholder:text-muted-foreground/20 focus:bg-primary/5")} />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary/0 group-focus-within:border-primary/50 transition-colors"></div><div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary/0 group-focus-within:border-primary/50 transition-colors"></div>
                    </div>
                </div>
                <button onClick={() => performLogin(password)} disabled={isValidating} className={cn("w-full py-5 text-sm font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden group font-mono border", loginError ? "border-red-500/50 text-red-500 bg-red-500/10 cursor-not-allowed" : " bg-foreground text-background hover:bg-primary hover:border-primary hover:text-white dark:hover:text-black")}>
                    <span className="relative z-10 flex items-center justify-center gap-2 transition-all">{isValidating ? 'Processing...' : 'Establish Link'}{!isValidating && <span className="hidden group-hover:inline-block transition-transform group-hover:translate-x-1">-{'>'}</span>}</span>
                </button>
            </div>
            <div className="h-8 flex items-center justify-center font-mono">
                {loginError ? (<div className="flex items-center gap-2 text-[10px] text-red-500 bg-red-500/5 px-3 py-1 border border-red-500/20 uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2"><span className="icon-[mdi--alert-circle-outline] size-3"></span><span>Error: Credentials Rejected</span></div>) : (<span className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.3em]">Waiting for input...</span>)}
            </div>
         </div>
         <div className="absolute bottom-6 text-[9px] text-muted-foreground/30 uppercase tracking-widest font-mono">Sys.Ver.3.5.0 // © {new Date().getFullYear()}</div>
      </main>

    </div>
  );
}
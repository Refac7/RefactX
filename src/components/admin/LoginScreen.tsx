import { useState } from 'react';
import { cn } from '~/lib/utils';
import { useAdmin } from './AdminContext';

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin();
  const [password, setPassword] = useState('');

    return (
        <div className="min-h-[80vh] flex items-center justify-center text-foreground font-mono p-6 relative">
                <div className="w-full max-w-sm bg-background border border-border p-1 relative">
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

            <div className="bg-muted/5 p-8 borderflex flex-col items-center">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="size-12 bg-primary/10 border border-primary flex items-center justify-center">
                            <span className="icon-[ph--terminal-window] size-6 text-primary"></span>
                        </div>
                    </div>
                    <h1 className="text-xl font-bold tracking-widest uppercase mb-2">Identity_Core</h1>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">Secure Access Required</p>
                </div>

                <div className="w-full space-y-4">
                    <div className="relative group">
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && performLogin(password)}
                            className={cn(
                                "w-full bg-background border p-3 text-center tracking-[0.5em] text-xs focus:outline-none transition-all duration-300 rounded-none",
                                loginError ? "border-red-500 text-red-500 animate-pulse" : "border-border focus:border-primary text-foreground"
                            )}
                            placeholder="PASSKEY"
                            disabled={isValidating}
                            autoFocus
                        />
                    </div>

                    <button 
                        onClick={() => performLogin(password)} 
                        disabled={isValidating}
                        className={cn(
                            "w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-none border",
                            loginError 
                                ? "bg-red-500/10 text-red-500 border-red-500 hover:bg-red-500/20" 
                                : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                        )}
                    >
                        {isValidating ? 'VERIFYING...' : 'ESTABLISH_LINK'}
                    </button>
                </div>
                
                <div className="mt-8 pt-4 border-t border-dashed border-border/40 w-full flex justify-between text-[9px] text-muted-foreground/40">
                    <span>SYS: ONLINE</span>
                    <span>V.3.5.0</span>
                </div>
            </div>
        </div>
    </div>
  );
}
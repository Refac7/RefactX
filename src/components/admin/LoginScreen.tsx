import { useState } from 'react'
import { cn } from '~/lib/utils'
import { useAdmin } from './AdminContext'
import Captcha from '~/components/ui/Captcha'

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && captchaToken && username.trim()) {
      performLogin(username.trim(), password, captchaToken)
    }
  }

  return (
    <div className="relative min-h-[80vh] flex flex-col p-6 lg:p-12 font-sans overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-[30%] translate-y-[-30%] pointer-events-none" />

      {/* Top-left status */}
      <div className="absolute top-6 left-6 lg:top-12 lg:left-12 flex items-center gap-3 select-none">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75',
                loginError ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-ping'
              )}
            />
            <span className={cn('relative inline-flex rounded-full size-2', loginError ? 'bg-red-500' : 'bg-emerald-500')} />
          </span>
          <span className="text-xs font-medium text-foreground tracking-tight">RefactX Admin</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest hidden sm:inline">// Auth_Gate</span>
      </div>

      {/* Top-right */}
      <div className="absolute top-6 right-6 lg:top-12 lg:right-12 select-none">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Restricted</span>
      </div>

      {/* Bottom-left */}
      <div className="absolute bottom-6 left-6 lg:bottom-12 lg:left-12 select-none hidden sm:block">
        <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">Terminal ID: AX-01</span>
      </div>

      {/* Bottom-right */}
      <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 select-none">
        <span className="text-[10px] font-mono text-muted-foreground/40">&copy; {new Date().getFullYear()}</span>
      </div>

      {/* Login card */}
      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
        <div className="w-full max-w-85 bg-background/50 backdrop-blur-sm border border-border/40 p-8 sm:p-10 relative shadow-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center size-6 bg-primary/10 text-primary font-mono text-[10px] font-bold">
                AUTH
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Authenticate</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-8">Sign in to the CMS dashboard.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isValidating}
                placeholder="admin"
                autoFocus
                autoComplete="username"
                className={cn(
                  'w-full px-4 py-2.5 border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                  loginError
                    ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                    : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Passkey</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isValidating}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  'w-full px-4 py-2.5 border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                  loginError
                    ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                    : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                )}
              />
            </div>

            <Captcha onVerify={setCaptchaToken} />

            <button
              onClick={() => captchaToken && performLogin(username.trim(), password, captchaToken)}
              disabled={isValidating || !captchaToken || !username.trim()}
              className={cn(
                'w-full py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2',
                !captchaToken || !username.trim() || loginError
                  ? 'bg-muted text-muted-foreground border border-border/50 cursor-not-allowed'
                  : 'bg-foreground text-background hover:bg-foreground/90 shadow-sm'
              )}
            >
              {isValidating ? (
                <>
                  <span className="icon-[ph--spinner] animate-spin size-4" /> Verifying...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>

          <div className="mt-6 h-4 flex items-center justify-center">
            {loginError && (
              <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                <span className="icon-[ph--warning-circle] size-3.5" />
                Invalid credentials.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

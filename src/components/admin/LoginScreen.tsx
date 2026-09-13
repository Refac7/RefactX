import { useState } from 'react'
import { cn } from '~/lib/utils'
import { useAdmin } from './AdminContext'
import Captcha from '~/components/ui/Captcha'

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = Boolean(captchaToken && username.trim() && password)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit) {
      performLogin(username.trim(), password, captchaToken!)
    }
  }

  return (
    <div className="relative min-h-screen bg-muted/10 font-sans flex flex-col overflow-hidden">
      {/* Background grid decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--border) / 0.28) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.28) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[40rem] blur-3xl rounded-full"
        style={{ background: 'hsl(var(--primary) / 0.06)' }}
      />

      {/* Header bar */}
      <header className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 sticky top-0">
        <div className="px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 select-none">
              <div className="size-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="icon-[ph--terminal-window] size-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">RefactX CMS</h1>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">System Controller</span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center border border-border/40 bg-muted/20 px-2 py-0.5 text-[10px] font-mono">
              <span className="icon-[ph--lock-simple] size-3 text-primary mr-1.5" />
              Auth_Gate
            </span>
          </div>
          <div className="flex items-center gap-2 select-none">
            <span className="relative flex size-2">
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  loginError ? 'bg-red-400' : 'bg-emerald-400'
                )}
              />
              <span className={cn('relative inline-flex rounded-full size-2', loginError ? 'bg-red-500' : 'bg-emerald-500')} />
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Restricted</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col px-6 lg:px-8 xl:px-12 py-8 lg:py-12">
        <div className="w-full grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          {/* Left: system intro */}
          <div className="hidden lg:flex flex-col justify-between min-h-[26rem]">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center justify-center size-6 bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] font-bold">
                  SSH
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">Secure Session</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
                Control your
                <br />
                publishing <span className="text-primary">infrastructure.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm text-muted-foreground leading-relaxed">
                Authenticate to access the RefactX content management system — manage posts, configuration data and deployment.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: 'ph--files', label: 'Manage posts & config data' },
                { icon: 'ph--queue', label: 'Queue & batch commit changes' },
                { icon: 'ph--github-logo', label: 'GitHub-backed content sync' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center justify-center size-7 bg-primary/5 border border-primary/15 text-primary">
                    <span className={cn('size-4', `icon-[${item.icon}]`)} />
                  </span>
                  {item.label}
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">
              // System v1.0 — Terminal ID: AX-01
            </div>
          </div>

          {/* Right: login card */}
          <div className="flex flex-col w-full max-w-md mx-auto lg:mx-0 justify-center">
            <div className="bg-background/70 backdrop-blur-sm border border-border/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] p-8 sm:p-10 relative">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/60" />

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center size-6 bg-primary/10 text-primary font-mono text-[10px] font-bold">
                    AUTH
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">Authenticate</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-8">Sign in to the CMS dashboard.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 icon-[ph--user] size-4" />
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
                        'w-full pl-9 pr-4 py-2.5 border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                        loginError
                          ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                          : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Passkey</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 icon-[ph--key] size-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isValidating}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        'w-full pl-9 pr-10 py-2.5 border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                        loginError
                          ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                          : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                      )}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className={cn('size-4', showPassword ? 'icon-[ph--eye-slash]' : 'icon-[ph--eye]')} />
                    </button>
                  </div>
                </div>

                <Captcha onVerify={setCaptchaToken} />

                <button
                  onClick={() => canSubmit && performLogin(username.trim(), password, captchaToken!)}
                  disabled={isValidating || !canSubmit}
                  className={cn(
                    'w-full py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    canSubmit && !loginError
                      ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm'
                      : 'bg-muted text-muted-foreground border border-border/50 cursor-not-allowed'
                  )}
                >
                  {isValidating ? (
                    <>
                      <span className="icon-[ph--spinner] animate-spin size-4" /> Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <span className="icon-[ph--arrow-right] size-4" />
                    </>
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

            <div className="mt-6 flex items-center justify-between px-1 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">
              <span>Terminal ID: AX-01</span>
              <span>&copy; {new Date().getFullYear()} RefactX</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
